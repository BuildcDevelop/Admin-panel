// admin-panel/backend/src/services/vervenAPI.ts
import axios from 'axios';

const VERVEN_API_BASE = process.env.VERVEN_API_URL || 'http://localhost:3000/api';

export class VervenAPIClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = VERVEN_API_BASE;
  }
  
  // Místo lokální PostgreSQL, volej Verven
  async createWorld(worldData: any) {
    const response = await axios.post(`${this.baseURL}/admin/worlds`, worldData);
    return response.data;
  }
  
  async getWorlds() {
    const response = await axios.get(`${this.baseURL}/admin/worlds`);
    return response.data;
  }
  
  async getWorldDetail(worldId: string) {
    const response = await axios.get(`${this.baseURL}/admin/worlds/${worldId}`);
    return response.data;
  }
  
  async deleteWorld(worldId: string) {
    const response = await axios.delete(`${this.baseURL}/admin/worlds/${worldId}`);
    return response.data;
  }
  
  async updateWorldStatus(worldId: string, status: string) {
    const response = await axios.patch(`${this.baseURL}/admin/worlds/${worldId}/status`, { status });
    return response.data;
  }
  
  async banPlayer(playerId: string, banData: any) {
    const response = await axios.post(`${this.baseURL}/admin/players/${playerId}/ban`, banData);
    return response.data;
  }
  
  // Pro budoucí admin funkce
  async getPlayers(worldId?: string) {
    const url = worldId ? `/admin/players?worldId=${worldId}` : '/admin/players';
    const response = await axios.get(`${this.baseURL}${url}`);
    return response.data;
  }
  
  async getVillages(worldId: string) {
    const response = await axios.get(`${this.baseURL}/admin/worlds/${worldId}/villages`);
    return response.data;
  }
}

// Default export
const vervenAPI = new VervenAPIClient();
export default vervenAPI;