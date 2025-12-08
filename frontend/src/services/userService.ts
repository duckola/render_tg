import apiClient from '../utils/api';

export interface StaffPerformance {
  userId: number;
  fullName: string;
  schoolId: string;
  email: string;
  totalOrdersProcessed: number;
  completedOrders: number;
  pendingOrders: number;
  completionRate: number;
}

export const userService = {
  getStaffPerformance: async (): Promise<StaffPerformance[]> => {
    const response = await apiClient.get<StaffPerformance[]>('/api/users/staff/performance');
    return response.data;
  },
};

