
/**
 * Posts an image and message to a Facebook Page using the Graph API.
 * 
 * Requirements:
 * - Page ID
 * - Page Access Token (with pages_manage_posts, pages_read_engagement permissions)
 */
export const postToFacebook = async (
  pageId: string,
  accessToken: string,
  message: string,
  imageBase64: string
) => {
  try {
    // 1. Convert Base64 Data URI to Blob
    const response = await fetch(imageBase64);
    const blob = await response.blob();

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('source', blob, 'image.png');
    formData.append('message', message);
    formData.append('access_token', accessToken);

    // 3. Send to Graph API
    const apiResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: 'POST',
      body: formData,
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.error?.message || `Facebook Error: ${apiResponse.statusText}`);
    }

    return data; // Returns { id, post_id }
  } catch (error: any) {
    console.error('Facebook Post Error:', error);
    throw new Error(error.message || 'Failed to post to Facebook');
  }
};
