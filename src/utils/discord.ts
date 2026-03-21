const DISCORD_API = "https://discord.com/api/v10";

async function discordFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res.json();
}

export async function createProjectChannel({
  projectName,
  companyName,
}: {
  projectName: string;
  companyName?: string;
}) {
  const channelName = (companyName || projectName)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎ]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);

  // Create channel
  const channel = await discordFetch(
    `/guilds/${process.env.DISCORD_GUILD_ID}/channels`,
    {
      method: "POST",
      body: JSON.stringify({
        name: channelName,
        type: 0,
        topic: `${companyName ? `${companyName} - ` : ""}${projectName}`,
      }),
    }
  );

  // Create permanent invite link
  const invite = await discordFetch(`/channels/${channel.id}/invites`, {
    method: "POST",
    body: JSON.stringify({ max_age: 0, max_uses: 0, unique: true }),
  });

  return {
    channelId: channel.id as string,
    inviteLink: `https://discord.gg/${invite.code}` as string,
  };
}
