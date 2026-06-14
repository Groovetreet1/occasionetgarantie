/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import AndroidDashboard from './components/AndroidDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <main className="px-4 py-2">
        <AndroidDashboard />
      </main>
    </div>
  );
}

