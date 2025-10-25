import { Client, GatewayIntentBits, PermissionsBitField } from "discord.js";
import express from "express";

const TP_ROLE_ID = "1431178450256789635"; // あなたのTPロールID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ====== Discord Bot ======
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // --- ?tp @ユーザー チャンネル名 ---
  if (command === "?tp" && args.length >= 2) {
    const member = message.mentions.members.first();
    const channelName = args.slice(1).join(" ");

    if (!member) return message.reply("⚠️ ユーザーをメンションしてください。");
    const channel = message.guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.isVoiceBased(),
    );
    if (!channel) return message.reply("⚠️ ボイスチャンネルが見つかりません。");

    const authorHasTP = message.member.roles.cache.has(TP_ROLE_ID);
    const targetHasTP = member.roles.cache.has(TP_ROLE_ID);
    if (!authorHasTP) return message.reply("あなたにTPロールがありません。");
    if (!targetHasTP) return message.reply("相手にTPロールがありません。");

    try {
      await member.voice.setChannel(channel);
      message.reply(`${member.user.tag} を ${channel.name} に移動させました。`);
    } catch (error) {
      console.error(error);
      message.reply("ボイスチャンネルの移動に失敗しました。");
    }
  }

  // --- ?tp ロールの付与・剥奪 ---
  else if (command === "?tp") {
    const tpRole = message.guild.roles.cache.get(TP_ROLE_ID);
    if (!tpRole) return message.reply("TPロールが見つかりません。");

    if (message.member.roles.cache.has(TP_ROLE_ID)) {
      await message.member.roles.remove(tpRole);
      message.reply("TPロールを剥奪しました。");
    } else {
      await message.member.roles.add(tpRole);
      message.reply("TPロールを付与しました。");
    }
  }
});

// ====== Webサーバー (Replit 用) ======
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  res.send(`✅ Bot is alive at ${url}`);
});

app.listen(port, () => console.log(`🌐 Web server running on port ${port}`));

// ====== Discord ログイン ======
client.login(process.env.DISCORD_TOKEN);
