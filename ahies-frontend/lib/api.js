// lib/api.js

// 1. Load the backend URL from our environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches all persons from the backend.
 * Equivalent to a GET request to our Express API.
 */
export async function getPersons() {
    try {
        // Use the browser's native 'fetch' function to call our backend
        const response = await fetch(`${API_URL}/api/persons`, {
    cache: 'no-store' // <--- Forces Next.js to fetch fresh data every time
        });
        
        // If the backend returned a 404 or 500, throw a manual error
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response and return the data
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching persons from backend:', error);
        throw error; // Re-throw the error so the UI knows something went wrong
    }
}

/**
 * Sends a new person to the backend.
 * Equivalent to a POST request to our Express API.
 */
export async function createPerson(personData) {
    try {
        const response = await fetch(`${API_URL}/api/persons`, {
            method: 'POST',                   // We are telling the backend we want to CREATE data
            headers: {
                'Content-Type': 'application/json', // Tell the backend we are sending JSON
            },
            body: JSON.stringify(personData),       // Convert our JavaScript object to a JSON string
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

export async function getPersonFullProfile(personRoundId) {
    try {
        const response = await fetch(`${API_URL}/api/persons-full/${personRoundId}`, {
            cache: 'no-store' // Prevent caching so it always fetches fresh data
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