# NavigationPermissions

| hasDepartmentAdmin | hasPropertyAdmin | isOwner | → canManageDepartments | → canManageHotel | → canManageSchedule | → canManageUsers | → canViewDepartmentList | → canViewSchedule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| * | * | true | true | true | true | true | true | true |
| * | true | * | true | true | true | true | true | true |
| true | * | * | true | false | true | false | false | true |
| * | * | * | false | false | false | false | false | true |
