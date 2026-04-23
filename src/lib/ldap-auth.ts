// src/lib/ldap-auth.ts
import * as ldap from 'ldapjs';
import { ldapConfig } from './ldap-config';
import { sign } from 'jsonwebtoken';
import { User } from '@/types/user';

interface LDAPUser {
  dn: string;
  uid?: string;
  cn?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  memberOf?: string[];
  department?: string;
}

export async function authenticateWithLDAP(
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: ldapConfig.url,
      timeout: 5000, // Add timeout
      connectTimeout: 5000,
    });

    // Handle connection errors
    client.on('error', (err) => {
      console.error('LDAP connection error:', err);
      reject(
        new Error(
          'Failed to connect to authentication server. Please try again later.'
        )
      );
    });

    // Replace username placeholder in search filter
    const searchFilter = ldapConfig.searchFilter.replace(
      '{{username}}',
      username
    );

    // First, search for the user to get their DN
    client.search(
      ldapConfig.searchBase,
      {
        filter: searchFilter,
        scope: 'sub',
        attributes: [
          'dn',
          'uid',
          'cn',
          'mail',
          'givenName',
          'sn',
          'memberOf',
          'department',
        ],
      },
      (searchErr, searchRes) => {
        if (searchErr) {
          client.unbind();
          return reject(new Error(`LDAP search error: ${searchErr.message}`));
        }

        const entries: LDAPUser[] = [];

        searchRes.on('searchEntry', (entry) => {
          const user: LDAPUser = {
            dn: entry.objectName || '', // Add fallback to empty string
          };

          // Extract other attributes
          entry.attributes.forEach((attr) => {
            const key = attr.type;
            const values = attr.vals;
            if (values && values.length > 0) {
              if (key === 'memberOf') {
                // Handle memberOf specially as an array
                user.memberOf = Array.isArray(values)
                  ? values.map((v: string | Buffer) => v.toString())
                  : [values.toString()];
              } else if (
                key === 'uid' ||
                key === 'cn' ||
                key === 'mail' ||
                key === 'givenName' ||
                key === 'sn' ||
                key === 'department'
              ) {
                // Handle only known properties
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (user as any)[key] = values[0].toString();
              }
            }
          });

          entries.push(user);
        });

        searchRes.on('error', (err) => {
          client.unbind();
          reject(new Error(`LDAP search error: ${err.message}`));
        });

        searchRes.on('end', () => {
          if (entries.length === 0) {
            client.unbind();
            return reject(new Error('User not found'));
          }

          const userEntry = entries[0];

          // Now bind with the user's DN and provided password to verify credentials
          client.bind(userEntry.dn, password, (bindErr) => {
            if (bindErr) {
              client.unbind();
              return reject(new Error('Invalid username or password'));
            }

            // Authentication successful, create user object and JWT token
            const user: User = {
              id: userEntry.uid || '',
              name:
                `${userEntry.givenName || ''} ${userEntry.sn || ''}`.trim() ||
                userEntry.cn ||
                username,
              email: userEntry.mail || '',
              role: determineUserRole(userEntry.memberOf || []),
              department: userEntry.department || 'Unknown',
            };

            // Generate JWT token
            const secretKey = process.env.JWT_SECRET || 'default-secret-key';
            const token = sign(
              {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
              },
              secretKey,
              { expiresIn: '1d' }
            );

            client.unbind();
            resolve({ user, token });
          });
        });
      }
    );
  });
}

// Helper function to determine user role based on LDAP group membership
function determineUserRole(memberOf: string[]): 'admin' | 'approver' | 'user' {
  const lowerCaseGroups = memberOf.map((group) => group.toLowerCase());

  if (
    lowerCaseGroups.some(
      (group) => group.includes('admin') || group.includes('administrators')
    )
  ) {
    return 'admin';
  }

  if (lowerCaseGroups.some((group) => group.includes('approver'))) {
    return 'approver';
  }

  return 'user';
}
