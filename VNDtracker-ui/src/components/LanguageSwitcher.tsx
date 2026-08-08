import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useLanguage, type Language } from '../i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <ToggleButtonGroup
      size="small"
      value={language}
      exclusive
      onChange={(_, value: Language | null) => value && setLanguage(value)}
      aria-label="Language"
    >
      <ToggleButton value="en" sx={{ px: 1.5 }}>
        EN
      </ToggleButton>
      <ToggleButton value="vi" sx={{ px: 1.5 }}>
        VI
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
