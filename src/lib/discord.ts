export const sendDiscordNotification = async (embed: any) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("Discord Webhook URL not configured. (Missing VITE_DISCORD_WEBHOOK_URL in .env). Skipping notification.");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "State Police Network",
        avatar_url: "https://images.unsplash.com/photo-1550993510-c1192fa942be?q=80&w=256&h=256&auto=format&fit=crop",
        embeds: [embed]
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Discord webhook:", response.status, response.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error sending Discord webhook:", err);
    return false;
  }
};
