import { route } from "@fal-ai/server-proxy/nextjs";

// This securely routes fal.ai client requests through the server 
// to automatically attach the FAL_KEY without exposing it.
export const { GET, POST } = route;
