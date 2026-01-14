import { PSBOrder } from '@/types/psb';

/**
 * Helper function to extract technician name from PSBOrder
 * Supports both string and object format for backward compatibility
 */
export const getTechnicianName = (order: PSBOrder): string => {
  if (!order.technician) {
    return '';
  }
  
  // If technician is a string, return it
  if (typeof order.technician === 'string') {
    return order.technician;
  }
  
  // If technician is an object, return the name property
  if (typeof order.technician === 'object' && order.technician.name) {
    return order.technician.name;
  }
  
  return '';
};

/**
 * Helper function to check if technician matches a given name
 * Supports both string and object format for backward compatibility
 */
export const isTechnicianMatch = (order: PSBOrder, technicianName: string): boolean => {
  const orderTechName = getTechnicianName(order).trim().toLowerCase();
  const compareeName = technicianName.trim().toLowerCase();
  return orderTechName === compareeName;
};
