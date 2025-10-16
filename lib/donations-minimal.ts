"use server"

// Minimal version - tanpa admin client dependency
// TODO: Restore admin functions setelah env vars fixed

export async function createDonation(data: any) {
  try {
    // TODO: Implement with proper admin client
    return { success: false, error: "Admin setup required" }
  } catch (error) {
    return { success: false, error: "Not implemented yet" }
  }
}

export async function getDonations(filters?: any) {
  return { success: false, data: [], error: "Admin setup required" }
}

export async function updateDonationStatus(id: string, status: string) {
  return { success: false, error: "Admin setup required" }
}

export async function deleteDonation(id: string) {
  return { success: false, error: "Admin setup required" }
}
