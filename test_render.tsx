import React from 'react';
import { renderToString } from 'react-dom/server';
import { BusinessQuestionnaireView } from './src/components/questionnaire/BusinessQuestionnaireView';

try {
  const html = renderToString(
    <BusinessQuestionnaireView 
      selectedClient="Apex Electronics Corp"
      selectedDistributor="Midwest Trading Co."
      currentUser={{ name: "Tester", email: "test@example.com", role: "Auditor" } as any}
    />
  );
  console.log("Render successful. Length:", html.length);
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
