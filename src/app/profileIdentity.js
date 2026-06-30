import { meiroUserIdFromCookie } from "../api/profileClient.js";

export function profileIdentity(state) {
  const userId = meiroUserIdFromCookie();
  if (!state.booking) return { user_id: userId };
  return {
    user_id: userId || state.booking.user_id || state.booking.email,
    email: state.booking.email,
    phone: state.booking.phone,
    firstName: state.booking.first_name,
    surname: state.booking.surname,
    lastName: state.booking.last_name || state.booking.surname
  };
}
