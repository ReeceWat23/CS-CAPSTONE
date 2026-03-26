/**
 * Basic Search – shared search logic; data from private (agent) or public (guest) lists.
 */

import { API_CONFIG, bubble_auth_headers } from '../frontend/API_bubble/api_connect.js';

const headers = bubble_auth_headers();

/** Normalize API refs (Bubble: Name, _id, Agent score, type? etc.) to common shape */
export function normalize_referrals(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list.map(r => ({
        id: r._id ?? r.id,
        name: (r.Name ?? r.name ?? r.name_ ?? '').toString().trim(),
        desc: (r.desc ?? r.Desc ?? r.description ?? '').toString().trim(),
        type: (r['type?'] ?? r.type ?? '').toString().trim(),
        agent_score: Number(r['Agent score'] ?? r.agent_score ?? 0) || 0,
        requests: Number(r.requests ?? 0) || 0,
        link: r.link ?? null,
        pricing_details: (r['Pricing details '] ?? r['Pricing details'] ?? r.pricing_details) ?? null,
    }));
}

/** Pure search: score and rank referrals by query. Returns matches array. */
export function run_search(referrals, query) {
    const searchQuery = (query || '').toLowerCase().trim();
    const searchTerms = searchQuery.split(/\s+/).filter(Boolean);

    return referrals
        .map(referral => {
            let score = 0;
            const matchFields = [];
            const nameLower = (referral.name || '').toLowerCase();
            const descLower = (referral.desc || '').toLowerCase();
            const typeLower = (referral.type || '').toLowerCase();

            if (searchQuery && nameLower.includes(searchQuery)) {
                score += 10;
                matchFields.push('name');
            }
            const nameWordHits = searchTerms.filter(t => t && nameLower.includes(t));
            if (nameWordHits.length > 0) {
                score += nameWordHits.length * 5;
                if (!matchFields.includes('name')) matchFields.push('name');
            }

            if (searchQuery && descLower.includes(searchQuery)) {
                score += 5;
                matchFields.push('desc');
            }
            const descWordHits = searchTerms.filter(t => t && descLower.includes(t));
            if (descWordHits.length > 0) {
                score += descWordHits.length * 2;
                if (!matchFields.includes('desc')) matchFields.push('desc');
            }

            if (searchQuery && typeLower.includes(searchQuery)) {
                score += 5;
                matchFields.push('type');
            }
            const typeWordHits = searchTerms.filter(t => t && typeLower.includes(t));
            if (typeWordHits.length > 0) {
                score += typeWordHits.length * 3;
                if (!matchFields.includes('type')) matchFields.push('type');
            }

            if (matchFields.length > 0) {
                score += Math.min((referral.requests || 0) * 0.1, 2);
                score += Math.min((referral.agent_score || 0) * 0.5, 2.5);
            }

            return { referral, score, matchFields };
        })
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(m => ({
            id: m.referral.id,
            name: m.referral.name,
            score: m.score,
            matchFields: m.matchFields,
            desc: m.referral.desc,
            type: m.referral.type,
            agent_score: m.referral.agent_score,
            pricing_details: m.referral.pricing_details,
        }));
}

function extractRefs(data) {
    const raw = data?.response?.refs ?? data?.response?.['refs'] ?? data?.refs ?? data?.response?.referrals ?? data?.referrals ?? data?.['ref-list'];
    return Array.isArray(raw) ? raw : [];
}

/** Fetch private referrals for an agent (refs?user_id=). */
export async function fetch_agent_referrals(agent_id) {
    const url = `${API_CONFIG.baseUrl}/refs?user_id=${agent_id}`;
    const res = await fetch(url, { method: 'GET', headers });
    const data = await res.json();
    return extractRefs(data);
}

/** Fetch public referrals (guest list). Use your Bubble public_list endpoint. */
export async function fetch_public_referrals(agent_id) {
    const url = `${API_CONFIG.baseUrl}/public_list?agent_id=${agent_id}`;
    console.log('[guest_search] fetch_public_referrals', agent_id);

    let res;
    try {
        res = await fetch(url, { method: 'GET', headers });
    } catch (err) {
        console.error('[guest_search] fetch failed', err.message);
        throw new Error(`Public list unreachable: ${err.message}`);
    }

    console.log('[guest_search] public_list response', { status: res.status, ok: res.ok });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[guest_search] public_list non-JSON', res.status, text?.substring(0, 200));
        throw new Error(`Public list returned invalid response (${res.status})`);
    }

    let data;
    try {
        data = await res.json();
    } catch (err) {
        console.error('[guest_search] public_list JSON parse error', err.message);
        throw new Error('Public list returned invalid JSON');
    }

    if (!res.ok) {
        const errMsg = data?.error ?? data?.message ?? res.statusText ?? `HTTP ${res.status}`;
        console.error('[guest_search] public_list error', res.status, errMsg);
        throw new Error(errMsg);
    }

    return extractRefs(data);
}

/** Handler: search over agent's private list (agent_id + query in body). */
export const search_referrals = async (req, res) => {
    try {
        const { agent_id, query } = req.body || req;
        if (!agent_id) {
            return res.status(400).json({ success: false, message: "Agent ID is required" });
        }
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const raw = await fetch_agent_referrals(agent_id);
        const referrals = normalize_referrals(raw);
        const matches = run_search(referrals, query);

        return res.status(200).json({
            success: true,
            query,
            agent_id,
            total_matches: matches.length,
            results: matches,
            referral_ids: matches.map(m => m.id),
        });
    } catch (error) {
        console.error('[search] error', error.message);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

/** Handler: search over public list (query only). */
export const guest_search = async (req, res) => {
    try {
        // const { query } = req.body || req;
        const { agent_id, query } = req.body || req;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }
        if (!agent_id) {
            return res.status(400).json({ success: false, message: "Agent ID is required" });
        }

        let raw;
        try {
            raw = await fetch_public_referrals(agent_id);
        } catch (err) {
            console.error('[guest_search] fetch_public_referrals failed', err.message);
            const status = err.message.includes('unreachable') ? 503 : 502;
            return res.status(status).json({
                success: false,
                message: err.message || 'Public list unavailable',
            });
        }

        const referrals = normalize_referrals(raw);
        const matches = run_search(referrals, query);

        return res.status(200).json({
            success: true,
            query,
            total_matches: matches.length,
            results: matches,
            referral_ids: matches.map(m => m.id),
        });
    } catch (error) {
        console.error('[guest_search] error', error.message);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};
