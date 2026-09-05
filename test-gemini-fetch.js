const key = "YOUR_API_KEY"; // Removed for security
async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  console.log("Status:", res.status, res.statusText);
  const data = await res.text();
  console.log("Response:", data);
}
test();
