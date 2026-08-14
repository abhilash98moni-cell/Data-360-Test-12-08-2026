import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

const stateVars = `
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [customSectionsDraft, setCustomSectionsDraft] = useState<any[]>([]);
  const [isEditRequesting, setIsEditRequesting] = useState<boolean>(false);
  const [isEditReviewing, setIsEditReviewing] = useState<boolean>(false);
`;

code = code.replace(
  "  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);",
  "  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);\n" + stateVars
);

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
  "  // 3. Update Sync Status Message",
  newMethods + "\n  // 3. Update Sync Status Message"
);

// We need to fix BUSINESS_QUESTIONNAIRE_SECTIONS usages
code = code.replaceAll("BUSINESS_QUESTIONNAIRE_SECTIONS", "activeSections");
// restore the import 
code = code.replace("import {\n  activeSections,", "import {\n  BUSINESS_QUESTIONNAIRE_SECTIONS,");

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('patched methods');
