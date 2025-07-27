// backend/src/services/vervenAPI.ts
import axios from 'axios';

// ✅ Správný port 4001 místo 3000  
const VERVEN_API_BASE = process.env.VERVEN_API_URL || 'http://localhost:4001/api';

export class VervenAPIClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = VERVEN_API_BASE;
    console.log(`🔗 VervenAPI client configured for: ${this.baseURL}`);
  }
  
  async createWorld(worldData: any) {
    console.log(`🔨 Creating world via: ${this.baseURL}/admin/worlds`);
    const response = await axios.post(`${this.baseURL}/admin/worlds`, worldData);
    return response.data;
  }
  
  async getWorlds() {
    console.log(`🌍 Getting worlds from: ${this.baseURL}/admin/worlds`);
    const response = await axios.get(`${this.baseURL}/admin/worlds`);
    return response.data;
  }
  
  async getWorldDetail(worldId: string) {
    console.log(`🔍 Getting world ${worldId} from: ${this.baseURL}/admin/worlds/${worldId}`);
    const response = await axios.get(`${this.baseURL}/admin/worlds/${worldId}`);
    return response.data;
  }
  
  async deleteWorld(worldId: string) {
    console.log(`🗑️ Deleting world ${worldId} via: ${this.baseURL}/admin/worlds/${worldId}`);
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

const vervenAPI = new VervenAPIClient();
export default vervenAPI;