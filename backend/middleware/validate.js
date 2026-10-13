const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s.-]{6,25}$/;
const STATUSES = ['active', 'inactive', 'lead'];

function validateCustomer(body = {}) {
  const errors = {};
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  const data = { firstName: s(body.firstName), lastName: s(body.lastName), email: s(body.email).toLowerCase(), phone: s(body.phone), city: s(body.city), status: s(body.status) || 'active' };
  if (!data.firstName) errors.firstName = 'First name is required.';
  if (!data.lastName) errors.lastName = 'Last name is required.';
  if (!data.email) errors.email = 'Email is required.'; else if (!EMAIL.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.phone && !PHONE.test(data.phone)) errors.phone = 'Enter a valid phone number.';
  if (!STATUSES.includes(data.status)) errors.status = `Status must be one of: ${STATUSES.join(', ')}.`;
  for (const k of ['firstName', 'lastName', 'city']) if (data[k].length > 80) errors[k] = 'Must be 80 characters or fewer.';
  if (data.email.length > 150) errors.email = 'Must be 150 characters or fewer.';
  return { errors, data, valid: Object.keys(errors).length === 0 };
}

module.exports = { validateCustomer, EMAIL };
