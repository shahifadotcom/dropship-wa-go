# Creating the Android Layout Directory

The `activity_login.xml` file has been created, but it needs to be placed in the correct Android resource directory structure.

## Steps to Create Layout Directory

After you `git pull` and run `npx cap sync android`, you need to create the layout directory:

### Option 1: Using Android Studio (Recommended)
1. Open the project in Android Studio
2. Navigate to `app/src/main/res/`
3. Right-click on `res` folder
4. Select **New > Android Resource Directory**
5. Choose **Resource type: layout**
6. Click OK

### Option 2: Manual Creation
```bash
# From project root
mkdir -p android-app/app/src/main/res/layout
```

## File Location

After creating the directory, the `activity_login.xml` file should be located at:
```
android-app/app/src/main/res/layout/activity_login.xml
```

## Verification

The file structure should look like:
```
android-app/
└── app/
    └── src/
        └── main/
            ├── AndroidManifest.xml
            ├── java/
            │   └── app/lovable/.../
            │       ├── LoginActivity.java ✓
            │       ├── MainActivity.java ✓
            │       └── AuthTokenManager.java ✓
            └── res/
                └── layout/
                    └── activity_login.xml ✓
```

## After Directory Creation

1. Copy the `activity_login.xml` content to the new location
2. Run `npx cap sync android` again
3. Build and run: `npx cap run android`
