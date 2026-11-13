// constants/roles.js
// Central role definitions. Keep these values in sync with the `users.role`
// ENUM in db/Query.sql and db/migrations/001_p0_security.sql.
const ROLES = {
    INPUTER: 'inputer',
    FIELD_USER: 'field_user',
    MANAGER: 'manager',
    ADMIN: 'admin',
    ADMINISTRATOR: 'administrator'
};

const ALL_ROLES = Object.values(ROLES);

// Roles allowed to manage configuration/lookup tables and review surveys.
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.ADMINISTRATOR];

// Roles allowed to reach the user-management endpoints.
const USER_MANAGEMENT_ROLES = [ROLES.MANAGER, ROLES.ADMIN, ROLES.ADMINISTRATOR];

// Which roles each caller may create.
// - manager can add inputers (per requirement)
// - admin can add inputers and field users
// - administrator can also add managers
// Nobody can create another administrator through the API.
const CREATABLE_ROLES = {
    [ROLES.MANAGER]: [ROLES.INPUTER],
    [ROLES.ADMIN]: [ROLES.INPUTER, ROLES.FIELD_USER],
    [ROLES.ADMINISTRATOR]: [ROLES.INPUTER, ROLES.FIELD_USER, ROLES.MANAGER]
};

// Which roles each caller may delete.
// - admin can delete inputers (per requirement)
// - administrator can delete inputers, field users, managers and admins
// Administrators themselves are protected from API deletion.
const DELETABLE_ROLES = {
    [ROLES.ADMIN]: [ROLES.INPUTER],
    [ROLES.ADMINISTRATOR]: [ROLES.INPUTER, ROLES.FIELD_USER, ROLES.MANAGER, ROLES.ADMIN]
};

module.exports = {
    ROLES,
    ALL_ROLES,
    ADMIN_ROLES,
    USER_MANAGEMENT_ROLES,
    CREATABLE_ROLES,
    DELETABLE_ROLES
};
