import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { ResearchScreen } from './screens/ResearchScreen';
import { TeamScreen } from './screens/TeamScreen';
import { TimesheetsScreen } from './screens/TimesheetsScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { ScanScreen } from './screens/ScanScreen';
import { MaintenanceScreen } from './screens/MaintenanceScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { EquipmentManagementScreen } from './screens/EquipmentManagementScreen';
import { PCAssignmentScreen } from './screens/PCAssignmentScreen';
import { FinanceOverviewScreen } from './screens/FinanceOverviewScreen';
import { PurchaseOrdersScreen } from './screens/PurchaseOrdersScreen';
import { ProjectFinanceAnalyticsScreen } from './screens/ProjectFinanceAnalyticsScreen';
import { FinanceDocumentsScreen } from './screens/FinanceDocumentsScreen';
import { MyDashboardScreen } from './screens/MyDashboardScreen';
import { TeamWorkloadScreen } from './screens/TeamWorkloadScreen';

function App() {
  return (
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeScreen />} />
              <Route path="my-dashboard" element={<MyDashboardScreen />} />
              <Route path="projects" element={<ProjectsScreen />} />
              <Route path="clients" element={<ClientsScreen />} />
              <Route path="research" element={<ResearchScreen />} />
              <Route path="team" element={<TeamScreen />} />
              <Route path="team-workload" element={<TeamWorkloadScreen />} />
              <Route path="timesheets" element={<TimesheetsScreen />} />
              <Route path="inventory" element={<InventoryScreen />} />
              <Route path="scan" element={<ScanScreen />} />
              <Route path="maintenance" element={<MaintenanceScreen />} />
              <Route path="equipment" element={<EquipmentManagementScreen />} />
              <Route path="pcs" element={<PCAssignmentScreen />} />
              <Route path="finance" element={<FinanceOverviewScreen />} />
              <Route path="finance/project-analytics" element={<ProjectFinanceAnalyticsScreen />} />
              <Route path="finance/documents" element={<FinanceDocumentsScreen />} />
              <Route path="purchase-orders" element={<PurchaseOrdersScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
            </Route>
          </Route>
          {/* Catch all unmatched routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </BrowserRouter>
  );
}

export default App;