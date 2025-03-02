const { v4: uuidv4 } = require('uuid');

async function callGraphQLEndpoint(query, variables = {}, secret) {
    const response = await fetch('https://public.api.socio.events/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'idempotency-key': uuidv4(),
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        }),
    });

    const responseBody = await response.json();
    if (response.ok) {
        return responseBody.data;
    } else {
        console.error('GraphQL Error:', responseBody);
        console.error('Query:', query);
        console.error('Variables:', variables);
        throw new Error(responseBody.errors ? responseBody.errors.map(error => error.message).join(', ') : 'Unknown error');
    }
}

module.exports = { callGraphQLEndpoint };