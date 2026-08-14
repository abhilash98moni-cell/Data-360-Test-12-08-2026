import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

const newMethods = `
  const activeSections = useMemo(() => {
    return questionnaireState?.customSections || BUSINESS_QUESTIONNAIRE_SECTIONS;
  }, [questionnaireState]);

  const handleRequestEditAccess = async () => {
    if (!questionnaireState || isEditRequesting) return;
    setIsEditRequesting(true);
    setSyncStatus('saving');
    try {
      const res = await requestEditAccessQuestionnaire(selectedClient, selectedDistributor, undefined, session.email, session.name);
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
      } else {
        throw new Error(res.error || 'Failed to request edit access');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsEditRequesting(false);
    }
  };

  const handleReviewEditAccess = async (action: 'APPROVE' | 'REJECT') => {
    if (!questionnaireState || isEditReviewing) return;
    setIsEditReviewing(true);
    setSyncStatus('saving');
    try {
      const res = await reviewEditAccessQuestionnaire(selectedClient, selectedDistributor, undefined, action, session.email, session.name);
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
      } else {
        throw new Error(res.error || 'Failed to review edit access');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsEditReviewing(false);
    }
  };

  const handleSaveCustomization = async (updatedSections: any[]) => {
    if (!questionnaireState) return;
    setSyncStatus('saving');
    try {
      const res = await customizeQuestionnaire(selectedClient, selectedDistributor, undefined, updatedSections, session.email, session.name);
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
        setIsCustomizeModalOpen(false);
      } else {
        throw new Error(res.error || 'Failed to customize questionnaire');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    }
  };
`;

code = code.replace(
  "  useEffect(() => {",
  newMethods + "\n  useEffect(() => {"
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('fixed methods');
