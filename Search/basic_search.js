/**
 * Basic Search - Search referrals for an agent based on query
 * 
 * @param {string} agent_id - The agent ID to fetch referrals for
 * @param {string} query - Search query text
 * @returns {Object} - Search results with matched referral IDs
 */

import { API_CONFIG } from '../frontend/API_bubble/api_connect.js';

const health_check_token = "571e360e38f0c11cded79162b849da13";

export const search_referrals = async (req, res) => {
    console.log('[search] entered');
    try {
        const { agent_id, query } = req.body || req;
        console.log('[search]', { agent_id, query });

        // Validate required parameters
        if (!agent_id) {
            return res.status(400).json({
                success: false,
                message: "Agent ID is required"
            });
        }

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        // TODO: Fetch agent's referrals from Bubble API
        // For now, we'll prepare the structure without making the actual API call
        // When ready, uncomment this:
        const refsUrl = `${API_CONFIG.baseUrl}/refs?user_id=${agent_id}`;
        console.log('[search] fetch', refsUrl);
        const referralsResponse = await fetch(refsUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${health_check_token}`,
            },
        });
        console.log('[search] refs status', referralsResponse.status);
        const referralsData = await referralsResponse.json();
        let raw = referralsData?.response?.refs ?? referralsData?.response?.['refs'] ?? referralsData?.['refs'] ?? referralsData?.response?.referrals ?? referralsData?.referrals;
        raw = Array.isArray(raw) ? raw : [];
        console.log('[search] raw list length', raw.length);
        if (raw[0]) console.log('[search] raw[0] keys', Object.keys(raw[0]));

        // Normalize: support Bubble (Name, _id, Agent score, type?) and API (name, id, etc.)
        const referrals = raw.map(r => {
            const name = (r.Name ?? r.name ?? r.name_ ?? '').toString().trim();
            const desc = (r.desc ?? r.Desc ?? r.description ?? '').toString().trim();
            const type = (r['type?'] ?? r.type ?? '').toString().trim();
            return {
                id: r._id ?? r.id,
                name,
                desc,
                type,
                agent_score: Number(r['Agent score'] ?? r.agent_score ?? 0) || 0,
                requests: Number(r.requests ?? 0) || 0,
                link: r.link ?? null,
                pricing_details: (r['Pricing details '] ?? r['Pricing details'] ?? r.pricing_details) ?? null
            };
        });

        // Search: phrase + word match in name/desc/type, then boost by agent_score and requests
        const searchQuery = query.toLowerCase().trim();
        const searchTerms = searchQuery.split(/\s+/).filter(Boolean);

        const matches = referrals
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
                pricing_details: m.referral.pricing_details
            }));

        console.log('[search] matches', matches.length, 'query:', query);
        // Prepare return payload
        return res.status(200).json({
            success: true,
            query: query,
            agent_id: agent_id,
            total_matches: matches.length,
            results: matches,
            referral_ids: matches.map(m => m.id)
        });

    } catch (error) {
        console.error('[search] error', error.message, error.stack);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

