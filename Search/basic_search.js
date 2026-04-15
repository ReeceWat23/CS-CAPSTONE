/**
 * Basic Search – shared search logic; data from private (agent) or public (guest) lists.
 */

import { API_CONFIG, bubble_auth_headers } from '../frontend/API_bubble/api_connect.js';

const headers = bubble_auth_headers();
const ALLOWED_TYPE_TAGS = [
    'Moving',
    'finance & Legal',
    'life & local fav',
    'Home improvement',
    'Businesses',
    'Other',
];
const TYPE_TAG_LOOKUP = new Map(
    ALLOWED_TYPE_TAGS.map(tag => [tag.toLowerCase(), tag]),
);

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

function normalize_type_filter(typeFilter) {
    if (Array.isArray(typeFilter)) {
        return typeFilter
            .map(t => (t ?? '').toString().trim().toLowerCase())
            .filter(Boolean);
    }
    const single = (typeFilter ?? '').toString().trim().toLowerCase();
    return single ? [single] : [];
}

function parse_type_filter(typeFilter) {
    const normalized = normalize_type_filter(typeFilter);
    const canonical = [];
    const invalid = [];
    for (const raw of normalized) {
        const matched = TYPE_TAG_LOOKUP.get(raw);
        if (matched) canonical.push(matched);
        else invalid.push(raw);
    }
    return {
        valid: invalid.length === 0,
        canonical: [...new Set(canonical)],
        invalid,
    };
}

function type_filter_response_shape(typeFilterList) {
    if (!typeFilterList || typeFilterList.length === 0) return null;
    if (typeFilterList.length === 1) return typeFilterList[0];
    return typeFilterList;
}

/** Bubble field name for category filter; also accepts legacy `type_filter` / `type` on the request. */
function type_filter_from_body(body) {
    if (!body || typeof body !== 'object') return undefined;
    return body['type?'] ?? body.type_filter ?? body.type;
}

/**
 * Search referrals: optionally narrow by Bubble category (`type?` values), then rank by text `query`.
 * When a type filter is present, every referral in that category is returned; text matching only affects
 * ordering and scores (rows with no text hit stay at score 0). Without a type filter, only query matches appear.
 */
export function run_search(referrals, query, typeFilter = null) {
    const searchQuery = (query || '').toLowerCase().trim();
    const searchTerms = searchQuery.split(/\s+/).filter(Boolean);
    const filteredTypes = normalize_type_filter(typeFilter);
    const hasTypeFilter = filteredTypes.length > 0;

    return referrals
        .filter(referral => {
            if (!hasTypeFilter) return true;
            const referralType = (referral.type || '').toString().trim().toLowerCase();
            return filteredTypes.includes(referralType);
        })
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
        .filter(m => m.score > 0 || hasTypeFilter)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (b.referral.agent_score || 0) - (a.referral.agent_score || 0);
        })
        .map(m => ({
            id: m.referral.id,
            name: m.referral.name,
            score: m.score,
            matchFields: m.matchFields,
            desc: m.referral.desc,
            'type?': m.referral.type,
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

/** Fetch public branhc for an agent 
 * 
 * by default all these branch referrals will only leverage public referrals 
*/
export async function fetch_branch_referrals(branch_id,owner_id) {
    const url = `${API_CONFIG.baseUrl}/get_branch_refs?branch_id=${branch_id}&owner_id=${owner_id}`;
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
        const body = req.body || req;
        const { agent_id, query } = body || {};
        const searchTypeFilter = type_filter_from_body(body);
        const parsedTypeFilter = parse_type_filter(searchTypeFilter);
        if (!agent_id) {
            return res.status(400).json({ success: false, message: "Agent ID is required" });
        }
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }
        if (!parsedTypeFilter.valid) {
            return res.status(400).json({
                success: false,
                message: `Invalid type filter. Allowed values: ${ALLOWED_TYPE_TAGS.join(', ')}`,
            });
        }

        const raw = await fetch_agent_referrals(agent_id);
        const referrals = normalize_referrals(raw);
        const matches = run_search(referrals, query, parsedTypeFilter.canonical);

        return res.status(200).json({
            success: true,
            query,
            agent_id,
            'type?': type_filter_response_shape(parsedTypeFilter.canonical),
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
        const body = req.body || req;
        const { agent_id, query } = body || {};
        const searchTypeFilter = type_filter_from_body(body);
        const parsedTypeFilter = parse_type_filter(searchTypeFilter);
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }
        if (!agent_id) {
            return res.status(400).json({ success: false, message: "Agent ID is required" });
        }
        if (!parsedTypeFilter.valid) {
            return res.status(400).json({
                success: false,
                message: `Invalid type filter. Allowed values: ${ALLOWED_TYPE_TAGS.join(', ')}`,
            });
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
        const matches = run_search(referrals, query, parsedTypeFilter.canonical);

        return res.status(200).json({
            success: true,
            query,
            'type?': type_filter_response_shape(parsedTypeFilter.canonical),
            total_matches: matches.length,
            results: matches,
            referral_ids: matches.map(m => m.id),
        });
    } catch (error) {
        console.error('[guest_search] error', error.message);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};



///** Handler: to search the branch & it's referrals */
export const branch_search = async (req, res) => {
    try {
        const body = req.body || req;
        const { branch_id, owner_id, query } = body || {};
        const searchTypeFilter = type_filter_from_body(body);
        const parsedTypeFilter = parse_type_filter(searchTypeFilter);
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }
        if (!branch_id) {
            return res.status(400).json({ success: false, message: "Branch ID is required" });
        }
        if (!parsedTypeFilter.valid) {
            return res.status(400).json({
                success: false,
                message: `Invalid type filter. Allowed values: ${ALLOWED_TYPE_TAGS.join(', ')}`,
            });
        }

        let raw;
        try {
            raw = await fetch_branch_referrals(branch_id,owner_id);
        } catch (err) {
            console.error('[guest_search] fetch_branch_referrals failed', err.message);
            const status = err.message.includes('unreachable') ? 503 : 502;
            return res.status(status).json({
                success: false,
                message: err.message || 'Branch list unavailable',
            });
        }

        const referrals = normalize_referrals(raw);
        const matches = run_search(referrals, query, parsedTypeFilter.canonical);

        return res.status(200).json({
            success: true,
            query,
            'type?': type_filter_response_shape(parsedTypeFilter.canonical),
            total_matches: matches.length,
            results: matches,
            referral_ids: matches.map(m => m.id),
        });
    } catch (error) {
        console.error('[guest_search] error', error.message);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};