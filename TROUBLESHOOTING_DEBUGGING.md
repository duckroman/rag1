# Troubleshooting and Debugging Guide

This document provides guidance on troubleshooting common issues and debugging the RAG application.

## 1. Common Errors and Solutions

### 1.1. React does not recognize the `isDragActive` prop on a DOM element.

**Error Message:**
```
React does not recognize the `isDragActive` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `isdragactive` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

**Cause:**
This error occurs when a prop intended for a React component (like `isDragActive` from `react-dropzone`) is passed down to a native HTML element (e.g., a `div`) that doesn't recognize it as a standard HTML attribute. In styled components, this often happens when custom props used for styling are not explicitly prevented from being forwarded to the underlying DOM element.

**Solution:**
To resolve this, you need to configure the styled component to filter out these custom props before they are passed to the DOM. For Material-UI's `styled` utility, you can use the `shouldForwardProp` option.

**Example Fix (in `FileDropzone.tsx`):**

```typescript
const DropzoneContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'isUploading',
})(({ theme, isDragActive, isUploading }) => ({
  // ... styling logic using isDragActive and isUploading
}));
```

This ensures that `isDragActive` and `isUploading` are used for styling within `DropzoneContainer` but are not added as attributes to the rendered `div` element.

### 1.2. API Endpoint Errors (e.g., 404, 500)

**Cause:**
- **404 Not Found:** The API endpoint URL is incorrect, or the server-side route is not properly defined.
- **500 Internal Server Error:** An unhandled error occurred on the server during processing. This could be due to issues with database connections, external API calls, or business logic.

**Solution:**
- **Check Network Tab:** Open your browser's developer tools and inspect the "Network" tab. Look for the failed API request to see the exact URL, request payload, and server response (including any error messages).
- **Server Logs:** Examine the server-side logs for your Next.js application (or whatever backend you are using). These logs will often provide detailed stack traces and error messages that pinpoint the exact cause of a 500 error.
- **Verify API Routes:** Double-check your `src/app/api` routes to ensure they match the client-side fetch requests and handle all expected scenarios.

### 1.3. Environment Variable Issues

**Cause:**
Missing or incorrectly configured environment variables can lead to various issues, especially with API keys, database connections, or external service integrations.

**Solution:**
- **`.env.local`:** Ensure all necessary environment variables are defined in your `.env.local` file (or `.env` for development).
- **Next.js Prefix:** Remember that client-side environment variables in Next.js must be prefixed with `NEXT_PUBLIC_`.
- **Restart Server:** After modifying environment variables, always restart your development server to ensure the changes are picked up.

### 1.4. Client Component Error (useEffect/useState in Server Component)

**Error Message:**
```
You're importing a component that needs `useEffect`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.
```

**Cause:**
In Next.js App Router, components are Server Components by default. React Hooks like `useState`, `useEffect`, `useRef`, etc., can only be used in Client Components. If you try to use these hooks in a Server Component without explicitly marking it as a Client Component, you will encounter this error.

**Solution:**
To resolve this, add the `"use client";` directive at the very top of the file where you are using React Hooks. This tells Next.js to render this component and its children as Client Components.

**Example Fix (in `src/app/page.tsx`):**
```typescript
'use client';
import { useState, useEffect } from 'react';
// ... rest of your component
```

This ensures that the component is rendered on the client side, allowing the use of React Hooks.

## 2. Debugging Techniques

### 2.1. Browser Developer Tools

- **Console:** Use `console.log()` to output variable values, track component lifecycles, and debug JavaScript execution.
- **Sources Tab:** Set breakpoints in your React components and API routes to step through code execution, inspect variables, and understand the flow.
- **Network Tab:** Monitor API requests and responses, check status codes, and inspect payloads.
- **Components Tab (React DevTools):** Inspect your React component tree, view props and state, and identify re-renders.

### 2.2. Server-Side Debugging

- **`console.log()` on Server:** Just like in the browser, `console.log()` can be used in your Next.js API routes or server-side logic to output information to your terminal.
- **Debugger (Node.js):** Use Node.js's built-in debugger or integrate with IDE debuggers (e.g., VS Code) to set breakpoints and step through server-side code.

### 2.3. Version Control (Git)

- **`git blame`:** Identify who made specific changes to a line of code, which can be helpful for understanding context.
- **`git bisect`:** Use `git bisect` to efficiently find the commit that introduced a bug by performing a binary search through your commit history.
- **Revert Changes:** If a recent change introduced a bug, consider reverting to a previous stable commit.

## 3. Asking for Help

When seeking help from others (e.g., teammates, online communities), provide as much detail as possible:

- **Clear Description:** Explain what you were trying to do, what happened, and what you expected to happen.
- **Error Messages:** Include the full error message and stack trace.
- **Relevant Code:** Share the relevant code snippets (e.g., component, API route, utility function).
- **Steps to Reproduce:** Provide clear steps that allow others to reproduce the issue.
- **Environment Details:** Mention your operating system, Node.js version, Next.js version, and any other relevant dependencies.