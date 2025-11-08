## PRD: Admin Price Management Dashboard

### 1\. Overview

Build a responsive admin dashboard using React, Ant Design (AntD) v5.28, and Firebase (v9+ modular API). The dashboard will be protected by Firebase Phone Authentication, requiring an admin-specific custom claim. It will feature two tabs: one to manage pricing configurations from a single Firestore document and one blank tab for future 'Orders'.

### 2\. Tech Stack

  * **UI:** React, Ant Design (AntD) v5.28
  * **Backend:** Firebase Authentication, Firestore (v9+ modular API)

-----

### 3\. Authentication & Authorization

  * **Login:** Implement Firebase Phone Authentication (`signInWithPhoneNumber`, `RecaptchaVerifier`).
  * **Authorization:**
      * After a user signs in, get their ID token result (`user.getIdTokenResult()`).
      * **Crucial:** Grant access to the dashboard **only if** `token.claims.Admin === true`.
      * If not an admin, display an AntD `Result` component with an "Access Denied" message.

-----

### 4\. Core Layout

Use the AntD `Layout` component for the main structure (e.g., `Layout.Header`, `Layout.Content`).

  * Inside `Layout.Content`, render an AntD `Tabs` component.
  * **Tab 1 (Default):**
      * `key`: "prices"
      * `label`: "Set Prices"
      * `children`: `<PriceConfigForm />`
  * **Tab 2:**
      * `key`: "orders"
      * `label`: "Orders"
      * `children`: Render an AntD `Empty` component.

-----

### 5\. Component: `PriceConfigForm` (Set Prices Tab)

This component manages the pricing configuration.

  * **Data Fetching:**
      * On component mount, fetch the single document from Firestore: `doc(db, "rateConfig", "charges")`.
  * **State Management:**
      * Use AntD `Form.useForm()`.
      * Store the fetched doc data in a React state (e.g., `initialData`).
      * Once data is fetched, populate the form using `form.setFieldsValue(initialData)`.
  * **UI Layout (Must be responsive):**
      * Use an AntD `Form` with `layout="vertical"` for mobile friendliness.
      * Render an AntD `Collapse` component (accordion mode) to organize product groups.
      * Iterate over the keys of the `initialData` object (e.g., `Object.keys(initialData).map(...)`).
      * For each key (e.g., "Gold", "Gold RTGS"), render an AntD `Collapse.Panel` with the key as the `header`.
  * **Form Fields (Inside each `Collapse.Panel`):**
      * For each product, render three `Form.Item`s. All fields are optional. Use `InputNumber` for all.
    <!-- end list -->
    1.  **Percentage:**
          * `label`: "Percentage"
          * `name`: `[productName, "percentage"]` (e.g., `["Gold", "percentage"]`)
          * `InputNumber` (addonAfter="%")
    2.  **Extra Charges:**
          * `label`: "Extra Charges"
          * `name`: `[productName, "extra"]`
          * `InputNumber`
    3.  **Manual Price:**
          * `label`: "Manual/Fixed Price"
          * `name`: `[productName, "manual"]`
          * `InputNumber`
  * **Submission:**
      * Add an AntD `Button` with `type="primary"`, `htmlType="submit"`, and text "Save Prices".
      * On the form's `onFinish` event, take the `values` object.
      * Write the entire `values` object back to the Firestore document `rateConfig/charges` using `setDoc` (with `merge: true`) or `updateDoc`.
      * Display AntD `message.success("Prices updated!")` on success or `message.error("Update failed.")` on error.

-----

### 6\. Data Model (Firestore)

  * **Collection:** `rateConfig`
  * **Document ID:** `charges`
  * **Document Structure:**
    ```json
    {
      "Gold": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold RTGS": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 1gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 2gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 5gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 10gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 50gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Gold Coin - 100gm": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Silver": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      },
      "Silver RTGS": {
        "extra": 100,
        "percentage": 3,
        "manual": 0
      }
    }
    ```