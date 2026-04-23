import ldap, { Attribute, SearchEntry } from 'ldapjs';
import { Client, SearchOptions } from 'ldapjs';

export interface LDAPUser {
  sAMAccountName: string;
  cn?: string;
  mail?: string;
  displayName?: string;
  department?: string;
  title?: string;
  company?: string;
  description?: string;
}

const ldapConfig = {
  url: process.env.LDAP_URL!,
  baseDNS: process.env.LDAP_BASE_DNS!,
  base: process.env.LDAP_BASE!,
  searchOptions: {
    scope: 'sub' as const,
    attributes: [
      'sAMAccountName',
      'userPrincipalName',
      'mail',
      'department',
      'displayName',
      'company',
      'description',
      'title',
    ],
  },
};

function extractAttributeValue(attr?: Attribute): string | undefined {
  if (!attr) return undefined;
  const values = Array.isArray(attr.values) ? attr.values : [attr.values];
  return values[0] as string;
}

export function cleanDisplayName(displayName?: string): string {
  if (!displayName) return '';
  return displayName
    .replace(/^(SCAN_|IPC_)/, '')
    .replace(/<.*>/, '')
    .trim();
}

export class LDAPService {
  static async authenticate(
    username: string,
    password: string
  ): Promise<LDAPUser> {
    return new Promise((resolve, reject) => {
      console.log(`LDAP authenticate attempt for: ${username}`);
      console.log(`LDAP_URL: ${ldapConfig.url}`);
      console.log(`LDAP_BASE: ${ldapConfig.base}`);
      console.log(`LDAP_BASE_DNS: ${ldapConfig.baseDNS}`);

      const bindDN = `${username}${ldapConfig.baseDNS}`;
      console.log(`Binding with DN: ${bindDN}`);

      // Bypass LDAP ใน dev mode
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.BYPASS_LDAP === 'true'
      ) {
        console.log('Development mode with LDAP bypass. Using mock user data.');
        return resolve({
          sAMAccountName: username,
          displayName: username,
          mail: `${username}@example.com`,
          department: 'Development',
          company: 'Mock Company',
          title: 'Developer',
          description: 'Mock user',
        });
      }

      const client: Client = ldap.createClient({
        url: ldapConfig.url,
        timeout: 10000,
        connectTimeout: 15000,
        reconnect: true,
      });

      client.on('error', (err) => {
        console.error('LDAP connection error:', err);
        reject(new Error(`ไม่สามารถเชื่อมต่อกับระบบ LDAP ได้: ${err.message}`));
      });

      client.bind(bindDN, password, (bindErr) => {
        if (bindErr) {
          console.error('LDAP bind error:', bindErr);
          client.unbind();
          if (bindErr.name === 'InvalidCredentialsError') {
            return reject(new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
          }
          return reject(
            new Error(`ไม่สามารถเข้าสู่ระบบ LDAP ได้: ${bindErr.message}`)
          );
        }

        console.log('LDAP bind successful, searching for user data...');

        // ✅ ค้นหาทั้ง sAMAccountName และ userPrincipalName
        const searchFilter = `(|(sAMAccountName=${username})(userPrincipalName=${username}${ldapConfig.baseDNS}))`;

        const searchOptions: SearchOptions = {
          scope: ldapConfig.searchOptions.scope,
          filter: searchFilter,
          attributes: ldapConfig.searchOptions.attributes,
          sizeLimit: 1,
        };

        console.log('🔎 LDAP search base:', ldapConfig.base);
        console.log('🔎 LDAP search filter:', searchFilter);
        console.log('🔎 LDAP attributes:', searchOptions.attributes);

        client.search(ldapConfig.base, searchOptions, (searchErr, res) => {
          if (searchErr) {
            console.error('LDAP search error:', searchErr);
            client.unbind();
            return reject(
              new Error(`ค้นหาข้อมูลผู้ใช้ไม่สำเร็จ: ${searchErr.message}`)
            );
          }

          let userData: LDAPUser | null = null;
          let entriesFound = 0;

          res.on('searchEntry', (entry: SearchEntry) => {
            entriesFound++;
            console.log(
              '🔍 LDAP entry.attributes types:',
              entry.attributes.map((a) => a.type)
            );
            console.log(
              '🔍 LDAP attributes and values:',
              entry.attributes.map((a) => ({ type: a.type, values: a.values }))
            );

            const findAttribute = (type: string) =>
              entry.attributes.find(
                (attr) => attr.type.toLowerCase() === type.toLowerCase()
              );

            userData = {
              sAMAccountName:
                extractAttributeValue(findAttribute('sAMAccountName')) ||
                username,
              mail: extractAttributeValue(findAttribute('mail')),
              displayName: extractAttributeValue(findAttribute('displayName')),
              department:
                extractAttributeValue(findAttribute('department')) ||
                'Unknown',
              company: extractAttributeValue(findAttribute('company')),
              title: extractAttributeValue(findAttribute('title')),
              description: extractAttributeValue(findAttribute('description')),
            };

            console.log(
              '🔍 Mapped LDAP userData:',
              JSON.stringify(userData, null, 2)
            );
          });

          res.on('error', (error) => {
            console.error('LDAP search response error:', error);
            client.unbind();
            reject(
              new Error(
                `เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้: ${error.message}`
              )
            );
          });

          res.on('end', (result) => {
            console.log(
              `LDAP search completed. Status: ${result?.status}, Entries found: ${entriesFound}`
            );
            client.unbind();

            if (userData) {
              // ✅ กันไม่ให้ department เป็น Unknown ถ้าไม่จำเป็น
              if (
                !userData.department ||
                userData.department.trim() === '' ||
                userData.department === 'Unknown'
              ) {
                userData.department = 'MIS'; // fallback safe default
              }
              resolve(userData);
            } else {
              console.log(
                'No LDAP user data found but authentication successful, creating minimal user profile'
              );
              resolve({
                sAMAccountName: username,
                displayName: username,
                mail: `${username}${ldapConfig.baseDNS}`,
                department: 'MIS', // fallback safe default
                company: 'Unknown',
                title: 'User',
                description: '',
              });
            }
          });
        });
      });
    });
  }
}
