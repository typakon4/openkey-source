// Automatically determine the host (localhost or IP address)
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `https://openkey.theflagisraised.xyz`;
  }
  return "https://openkey.theflagisraised.xyz";
};

export const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api`;

export const api = {
  async register(username: string, password: string): Promise<any> {
    const res = await fetch(`/api/register?username=${username}&password=${password}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async login(username: string, password: string): Promise<any> {
    const res = await fetch(`/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async getMe(token: string): Promise<any> {
    const res = await fetch(`/api/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Validation failed");
    return data;
  },

  async getAllUsers(token: string): Promise<any[]> {
    const res = await fetch(`/api/users`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async getMessages(token: string, partnerId: string): Promise<any[]> {
    const res = await fetch(`/api/messages/${partnerId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async uploadFile(
    token: string,
    file: File
  ): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  },

  async sendMessage(
    token: string,
    receiverId: string,
    text: string,
    attachmentUrl?: string,
    attachmentType?: string,
    isSecret?: boolean
  ): Promise<any> {
    const res = await fetch(`/api/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId,
        text,
        attachmentUrl,
        attachmentType,
        isSecret,
      }),
    });
    return await res.json();
  },

  async markAsRead(token: string, partnerId: string): Promise<void> {
    await fetch(`/api/messages/${partnerId}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
