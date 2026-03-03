/**
 * Saves a blog post as a draft to a WordPress site using the REST API.
 * 
 * Note: Browser-based requests to WordPress often face CORS (Cross-Origin Resource Sharing) restrictions.
 * The WordPress site must be configured to accept requests from this origin, or use a plugin 
 * like "Application Passwords" combined with a CORS configuration.
 */
export const saveToWordPress = async (
  siteUrl: string,
  username: string,
  appPassword: string,
  title: string,
  content: string
) => {
  // Normalize URL: remove trailing slash if present
  const baseUrl = siteUrl.trim().replace(/\/$/, '');
  const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;

  // Create Basic Auth header
  // Note: App Passwords usually allow Basic Auth
  const auth = btoa(`${username}:${appPassword}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      content: content,
      status: 'draft', // Save as draft
    }),
  });

  if (!response.ok) {
    // Try to parse error message from WP
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `WordPress Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};