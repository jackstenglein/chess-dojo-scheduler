// Discord API response types
export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}


export interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

// API URLs
export const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
export const DISCORD_USER_URL = 'https://discord.com/api/users/@me';
export const DISCORD_GUILD_PROD_ID = "951958534113886238";
export const DISCORD_GUILD_BETA_ID = "722843511132520549"; 
export const DISCORD_ROLE_BETA_ID = "1107651005547548742";
export const FreeUnVerifiedRole = "958008070817054790";

export const FreeCohortRoleId: Record<string, string> = {
  '0-300': "1347231021359431832",
  '300-400': "1347232898700542022",
  '400-500': "1347233681521246289",
  '500-600': "1347233929891020851",
  '600-700': "1347234137781567518",
  '700-800': "1347234570679881769",
  '800-900': "1347234797902106717",
  '900-1000': "1347234973698232404",
  '1000-1100': "1347235622636748892",
  '1100-1200': "1347236321915179050",
  '1200-1300': "1347236549292589186",
  '1300-1400': "1347237175481073746",
  '1400-1500': "1347236679034994800",
  '1500-1600': "1347237589429653545",
  '1600-1700': "1347237861795299379",
  '1700-1800': "1347238082146992198",
  '1800-1900': "1347238357155053611",
  '1900-2000': "1347238748538142793",
  '2000-2100': "1347238961252274197",
  '2100-2200': "1347239103904878715",
  '2200-2300': "1347239296448336033",
  '2300-2400': "1347239445308506215",
  '2400+': "1347240083052560415"
}


export const PaidCohortRoleId: Record<string, string> = {
    '0-300': "1107651005547548742",
    '300-400': "951960545077100645",
    '400-500': "951995036487254026",
    '500-600': "1107650883807891547",
    '600-700': "951995253378940999",
    '700-800': "1007088844425932820",
    '800-900': "951995299407212564",
    '900-1000': "1007089559550570578",
    '1000-1100': "951995406835925042",
    '1100-1200': "951995460174872586",
    '1200-1300': "951995519272624179",
    '1300-1400': "951996640271675403",
    '1400-1500': "951995556287377438",
    '1500-1600': "951995620049190942",
    '1600-1700': "951995656959058010",
    '1700-1800': "951995701909409862",
    '1800-1900': "951995756057882665",
    '1900-2000': "951995789935247441",
    '2000-2100': "951995832327086090",
    '2100-2200': "951995870264569916",
    '2200-2300': "951995912564121601",
    '2300-2400': "951995973385740329",
    '2400+': "951996035792764998"
}

export async function addUserToGuild(
  guildId: string,
  userId: string,
  userName: string,
  accessToken: string,
  botToken: string,
  roles?: string[],
): Promise<string> {
  console.log('Guild ID:', guildId);
  console.log('User ID:', userId);
  console.log('User Name:', userName);
  //console.log('Access Token:', accessToken);
 // console.log('Bot Token:', botToken);
  console.log('Roles:', roles);

  const url = `https://discord.com/api/guilds/${guildId}/members/${userId}`;

  console.log('URL:', url);

  const body = {
    access_token: accessToken,
    roles,
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return `Failed to add user to guild: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`;
    }

    console.log('User successfully added to guild.');

    switch (response.status) {
      case 201: // Successfully added to the guild
        return `Verification complete! ${userName} successfully added to ChessDojo Training Program.`;
      case 204: // Already a member
        return `Verification completed! ${userName} is already part of the Discord Server.`;
      default:
        return `Unexpected response: ${response.status} - ${response.statusText}`;
    }
  } catch (error) {
    console.error('Error adding user to guild:', error);
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function removeUserFromGuild(userId: string, guildId: string, botToken: string): Promise<string> {
   const url = `https://discord.com/api/guilds/${guildId}/members/${userId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (response.status === 204) {
      return 'Successfully removed from the ChessDojo Training Program Server.';
    } else {
      const errorData = await response.json();
      return `Failed to remove user from guild: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`;
    }
  } catch (error) {
    console.error('Error removing user from guild:', error);
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}


  