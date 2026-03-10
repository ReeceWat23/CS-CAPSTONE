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
    try {
        const { agent_id, query } = req.body || req;

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
        const referralsResponse = await fetch(`${API_CONFIG.baseUrl}/refs?user_id=${agent_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${health_check_token}`,
            },
        });
        const referralsData = await referralsResponse.json();
        let raw = referralsData?.response?.['ref-list'] ?? referralsData?.['ref-list'] ?? referralsData?.response?.referrals ?? referralsData?.referrals;
        raw = Array.isArray(raw) ? raw : [];

        // Normalize API format (Name, _id, Agent score, type?) to expected (name, id, agent_score, type)
        const referrals = raw.map(r => ({
            id: r._id ?? r.id,
            name: r.Name ?? r.name,
            desc: r.desc ?? '',
            type: r['type?'] ?? r.type ?? '',
            agent_score: r['Agent score'] ?? r.agent_score ?? 0,
            requests: r.requests ?? 0,
            link: r.link,
            pricing_details: r['Pricing details '] ?? r['Pricing details'] ?? r.pricing_details
        }));

        // Mock referrals data structure for testing (remove when ready to call API)
        // const referrals = [
        //     {
        //         id: 'ref1',
        //         name: "Bob's Plumbing",
        //         desc: "Bob is a plumber who has been in the business for 10 years and is known for his quality work",
        //         agent_score: 5,
        //         agent_id: agent_id,
        //         link: 'https://bobsplumbing.com',
        //         pricing_details: '$$',
        //         type: 'plumber',
        //         requests: 10
        //     },
        //     {
        //         id: 'ref2',
        //         name: "Alice's Electrical Services",
        //         desc: "Professional electrical services for residential and commercial properties",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$$',
        //         type: 'electrician',
        //         requests: 5
        //     },
        //     {
        //         id: 'ref3',
        //         name: "Mike's HVAC Solutions",
        //         desc: "Expert heating, ventilation, and air conditioning services. Emergency repairs available 24/7",
        //         agent_score: 5,
        //         agent_id: agent_id,
        //         link: 'https://mikeshvac.com',
        //         pricing_details: '$$$',
        //         type: 'hvac',
        //         requests: 15
        //     },
        //     {
        //         id: 'ref4',
        //         name: "Sarah's Roofing & Gutters",
        //         desc: "Quality roofing repairs and gutter installation. Licensed and insured contractors",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$',
        //         type: 'roofer',
        //         requests: 8
        //     },
        //     {
        //         id: 'ref5',
        //         name: "John's Handyman Services",
        //         desc: "General handyman work including plumbing, electrical, and carpentry. Quick response times",
        //         agent_score: 3,
        //         agent_id: agent_id,
        //         pricing_details: '$',
        //         type: 'handyman',
        //         requests: 20
        //     },
        //     {
        //         id: 'ref6',
        //         name: "Elite Plumbing Co",
        //         desc: "Premium plumbing services with 15 years of experience. Specializing in complex installations",
        //         agent_score: 5,
        //         agent_id: agent_id,
        //         link: 'https://eliteplumbing.com',
        //         pricing_details: '$$$$',
        //         type: 'plumber',
        //         requests: 12
        //     },
        //     {
        //         id: 'ref7',
        //         name: "Quick Fix Electrical",
        //         desc: "Fast and reliable electrical repairs. Same-day service available for urgent issues",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$',
        //         type: 'electrician',
        //         requests: 18
        //     },
        //     {
        //         id: 'ref8',
        //         name: "Green Energy Solar",
        //         desc: "Solar panel installation and renewable energy solutions. Helping homes go green",
        //         agent_score: 5,
        //         agent_id: agent_id,
        //         link: 'https://greenenergysolar.com',
        //         pricing_details: '$$$$',
        //         type: 'solar',
        //         requests: 6
        //     },
        //     {
        //         id: 'ref9',
        //         name: "Master Carpenter",
        //         desc: "Custom carpentry and woodworking. Kitchen cabinets, built-ins, and furniture",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$$',
        //         type: 'carpenter',
        //         requests: 9
        //     },
        //     {
        //         id: 'ref10',
        //         name: "Bob's Home Improvement",
        //         desc: "Full-service home improvement contractor. From small repairs to major renovations",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$',
        //         type: 'contractor',
        //         requests: 14
        //     },
        //     {
        //         id: 'ref11',
        //         name: "Pro Painters Plus",
        //         desc: "Interior and exterior painting services. Professional finish guaranteed",
        //         agent_score: 3,
        //         agent_id: agent_id,
        //         pricing_details: '$$',
        //         type: 'painter',
        //         requests: 11
        //     },
        //     {
        //         id: 'ref12',
        //         name: "Landscape Design Experts",
        //         desc: "Landscaping, lawn care, and garden design. Creating beautiful outdoor spaces",
        //         agent_score: 4,
        //         agent_id: agent_id,
        //         pricing_details: '$$$',
        //         type: 'landscaper',
        //         requests: 7
        //     }
        // ];

        // Perform search on referrals
        const searchQuery = query.toLowerCase().trim();
        const searchTerms = searchQuery.split(/\s+/); // Split into individual words

        const matches = referrals
            .map(referral => {
                let score = 0;
                const matchFields = [];

                // Search in name (highest weight)
                const nameLower = (referral.name || '').toLowerCase();
                if (nameLower.includes(searchQuery)) {
                    score += 10; // Exact phrase match
                    matchFields.push('name');
                } else {
                    // Check for individual word matches in name
                    const nameMatches = searchTerms.filter(term => nameLower.includes(term));
                    if (nameMatches.length > 0) {
                        score += nameMatches.length * 5;
                        matchFields.push('name');
                    }
                }

                // Search in description (medium weight)
                const descLower = (referral.desc || '').toLowerCase();
                if (descLower.includes(searchQuery)) {
                    score += 5; // Exact phrase match
                    matchFields.push('desc');
                } else {
                    // Check for individual word matches in description
                    const descMatches = searchTerms.filter(term => descLower.includes(term));
                    if (descMatches.length > 0) {
                        score += descMatches.length * 2;
                        matchFields.push('desc');
                    }
                }

                // Search in type (medium weight)
                const typeLower = (referral.type || '').toLowerCase();
                if (typeLower.includes(searchQuery)) {
                    score += 5;
                    matchFields.push('type');
                } else {
                    const typeMatches = searchTerms.filter(term => typeLower.includes(term));
                    if (typeMatches.length > 0) {
                        score += typeMatches.length * 3;
                        matchFields.push('type');
                    }
                }

                // Boost score based on requests (popularity indicator) - only when there's a match
                if (matchFields.length > 0) {
                    score += Math.min((referral.requests || 0) * 0.1, 2); // Cap at 2 points
                }

                return {
                    referral,
                    score,
                    matchFields
                };
            })
            .filter(match => match.score > 0) // Only include referrals with matches
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .map(match => ({
                id: match.referral.id,
                name: match.referral.name,
                score: match.score,
                matchFields: match.matchFields,
                // Include additional info for frontend
                desc: match.referral.desc,
                type: match.referral.type,
                agent_score: match.referral.agent_score,
                pricing_details: match.referral.pricing_details
            }));

        // Prepare return payload
        return res.status(200).json({
            success: true,
            query: query,
            agent_id: agent_id,
            total_matches: matches.length,
            results: matches,
            // Return just IDs for simple use case
            referral_ids: matches.map(m => m.id)
        });

    } catch (error) {
        console.error('Error searching referrals:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

