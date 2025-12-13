// Hook to initialize all stores with mock data for testing
import { useEffect } from 'react';
import { useTeamStore } from '../store/teamStore';
import { useClientStore } from '../store/clientStore';
import { useProjectStore } from '../store/projectStore';
import { usePCStore } from '../store/pcStore';
import { useResearchStore } from '../store/researchStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useCheckoutStore } from '../store/checkoutStore';
import { useInventoryStore } from '../store/inventoryStore';

/**
 * Hook to initialize all stores with mock data
 * Call this in your App or root component to populate stores with test data
 */
export const useInitializeMockData = () => {
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);
  const fetchClients = useClientStore((state) => state.fetchClients);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchPCs = usePCStore((state) => state.fetchPCs);
  const fetchResearchProjects = useResearchStore((state) => state.fetchResearchProjects);
  const fetchMaintenance = useMaintenanceStore((state) => state.fetchMaintenance);
  const fetchCheckouts = useCheckoutStore((state) => state.fetchCheckouts);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);

  useEffect(() => {
    // Initialize all stores with mock data
    const initializeStores = async () => {
      try {
        // Fetch data from all stores - they will use mock data if API calls fail
        await Promise.allSettled([
          fetchTeamMembers(),
          fetchClients(),
          fetchProjects(),
          fetchPCs(),
          fetchResearchProjects(),
          fetchMaintenance(),
          fetchCheckouts(),
          fetchInventory(),
        ]);

        console.log('✅ All stores initialized with mock data');
      } catch (error) {
        console.error('Error initializing stores:', error);
      }
    };

    initializeStores();
  }, [
    fetchTeamMembers,
    fetchClients,
    fetchProjects,
    fetchPCs,
    fetchResearchProjects,
    fetchMaintenance,
    fetchCheckouts,
    fetchInventory,
  ]);
};

export default useInitializeMockData;
