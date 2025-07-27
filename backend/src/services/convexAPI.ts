import { ConvexReactClient } from "convex/react";
import { api } from "../../verven/convex/_generated/api";

const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);

export const adminAPI = {
  // Místo POST /api/admin/world/create
  createWorld: (data) => convex.mutation(api.worlds.createWorld, data),
  
  // Místo GET /api/admin/worlds  
  getWorlds: () => convex.query(api.worlds.getWorlds),
  
  // Místo GET /api/admin/worlds/:id
  getWorldDetail: (worldId) => convex.query(api.worlds.getWorldDetail, { worldId }),
};

// React komponenta s real-time updates:
const AdminWorldsList = () => {
  const worlds = useQuery(api.worlds.getWorlds); // Automatické updates!
  const createWorld = useMutation(api.worlds.createWorld);
  
  // Stejné UI, jen jiné API volání
  return (
    <div>
      {worlds?.map(world => (
        <WorldCard key={world.id} world={world} />
      ))}
    </div>
  );
};
