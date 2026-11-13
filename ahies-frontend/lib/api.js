// lib/api.js

// 1. Load the backend URL from our environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetches all persons from the backend.
 * Server Components must pass the incoming Cookie header so the backend's
 * authentication guard can verify the signed JWT.
 */
export async function getPersons(requestHeaders = {}) {
    try {
        const response = await fetch(`${API_URL}/api/persons`, {
            cache: 'no-store', // Forces Next.js to fetch fresh data every time
            credentials: 'include',
            headers: requestHeaders,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching persons from backend:', error);
        throw error;
    }
}

/**
 * Sends a new person to the backend.
 */
export async function createPerson(personData) {
    try {
        const response = await fetch(`${API_URL}/api/persons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personData),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating person:', error);
        throw error;
    }
}

/**
 * Fetches the full profile of a person. Server Components must pass the
 * incoming Cookie header, as above.
 */
export async function getPersonFullProfile(personRoundId, requestHeaders = {}) {
    try {
        const response = await fetch(`${API_URL}/api/persons-full/${personRoundId}`, {
            cache: 'no-store',
            credentials: 'include',
            headers: requestHeaders,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching full profile:', error);
        throw error;
    }
}

export async function createHousehold(householdData) {
    try {
        const response = await fetch(`${API_URL}/api/households`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(householdData),
            credentials: 'include',
        });

        if (!response.ok) {
            // TRY TO READ THE ERROR MESSAGE FROM THE BACKEND
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating household:', error);
        throw error;
    }
}
