const referralData = {body : {
    "name": "Bobs Plumbing",
    "desc": "Bob is a plumber who has been in the business for 10 years and is known for his quality work",
    "agent_score": 5,
    "agent_id": "agent123",
    "link": "https://bobsplumbing.com",
    "picture": "https://example.com/picture.jpg",
    "pricing_details": "$$",
    "type": "plumber",
    "requests": 0
  }};

const url = 'https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize';

const response = await fetch(url, {
    method: 'POST',
    Authorization: 'Bearer 571e360e38f0c11cded79162b849da13',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(referralData)
});

console.log(response);