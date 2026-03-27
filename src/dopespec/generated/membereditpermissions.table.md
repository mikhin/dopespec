# MemberEditPermissions

| isOwner | isPropertyAdmin | isDepartmentAdmin | isSelfEdit | targetIsOwner | targetIsTerminated | → canEditPersonalData | → canEditOrgRole | → canEditPropertyAssignments | → canManageMembers | → canManageInvites | → propertyRoleScope | → departmentRoleScope |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| true | * | * | true | * | * | true | false | false | true | false | none | none |
| * | * | * | true | * | * | false | false | false | false | false | none | none |
| true | * | * | * | * | * | true | true | true | true | true | full | full |
| * | * | * | * | true | * | false | false | false | false | false | none | none |
| * | * | * | * | * | true | false | false | false | false | false | none | none |
| * | true | * | * | * | * | false | false | true | true | false | limited | full |
| * | * | true | * | * | * | false | false | false | true | false | none | limited |
| * | * | * | * | * | * | false | false | false | false | false | none | none |
