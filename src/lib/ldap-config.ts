// src/lib/ldap-config.ts
export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://your-ldap-server.com',
  baseDN: process.env.LDAP_BASE_DNS || 'dc=example,dc=com',
  searchBase: process.env.LDAP_BASE || 'ou=users,dc=example,dc=com',
  bindDN: process.env.LDAP_BIND_DN || '', // Admin DN for binding if needed
  bindCredentials: process.env.LDAP_BIND_CREDENTIALS || '', // Admin password if needed
  searchFilter: '(uid={{username}})', // Customize based on your LDAP schema
  usernameAttribute: 'uid',
  groupSearchBase: 'ou=groups,dc=example,dc=com',
  groupSearchFilter: '(member={{dn}})',
  groupSearchAttributes: ['cn'],
};
