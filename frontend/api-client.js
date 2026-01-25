class KnownIssuesApiClient {

    static getApiUrl() {
        return localStorage.getItem('vim_api_url') || 'http://localhost:3000/known-issues';
    }

    /**
     * Saves a new regex pattern to the backend.
     * @param {string} regex The regex pattern to save.
     * @returns {Promise<Object>} The saved issue object.
     */
    static async saveKnownIssue(regex) {
        try {
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ regex: regex })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save regex: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving known issue:', error);
            throw error;
        }
    }

    /**
     * Deletes a known issue by ID.
     * @param {number} id The ID of the issue to delete.
     * @returns {Promise<boolean>} True if successful.
     */
    static async deleteKnownIssue(id) {
        try {
            console.log(`Deleting known issue ${id}...`); // Debug log
            const response = await fetch(`${this.getApiUrl()}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`Failed to delete issue: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('Error deleting known issue:', error);
            throw error;
        }
    }

    /**
     * Fetches all known issues.
     * @returns {Promise<Array>} List of known issues.
     */
    static async getKnownIssues() {
        try {
            const response = await fetch(this.getApiUrl());
            if (!response.ok) {
                throw new Error(`Failed to fetch issues: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching known issues:', error);
            return [];
        }
    }
}

// Expose to window to ensure availability in other scripts
window.KnownIssuesApiClient = KnownIssuesApiClient;
