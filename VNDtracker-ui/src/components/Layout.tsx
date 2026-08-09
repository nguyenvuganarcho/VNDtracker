import { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { getUser, removeToken } from '../utils/auth';
import { useLanguage, type Language, type CurrencySymbol } from '../i18n';
import ChangePasswordDialog from './ChangePasswordDialog';

const NAV_ITEMS = [
  { labelKey: 'dashboard', path: '/' },
  { labelKey: 'expenses', path: '/expenses' },
  { labelKey: 'categoriesTitle', path: '/categories' },
  { labelKey: 'budgetsTitle', path: '/budgets' },
  { labelKey: 'scanReceipt', path: '/scan' },
] as const;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const { t, language, setLanguage, currencySymbol, setCurrencySymbol } = useLanguage();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <Box>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #e0e0e0' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileNavOpen(true)}
            sx={{ display: { sm: 'none' } }}
            aria-label="Menu"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700, mr: 3 }}
          >
            VNDtracker
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, gap: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: 'inherit',
                  fontWeight: location.pathname === item.path ? 700 : 400,
                }}
              >
                {t(item.labelKey)}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />

          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Account menu">
            <AccountCircleIcon />
          </IconButton>

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />

            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {t('language')}
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={language}
                exclusive
                onChange={(_, value: Language | null) => value && setLanguage(value)}
              >
                <ToggleButton value="en" sx={{ px: 1.5 }}>
                  EN
                </ToggleButton>
                <ToggleButton value="vi" sx={{ px: 1.5 }}>
                  VI
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ px: 2, py: 1.5, maxWidth: 240 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {t('currency')}
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={currencySymbol}
                exclusive
                onChange={(_, value: CurrencySymbol | null) => value && setCurrencySymbol(value)}
              >
                <ToggleButton value="đ" sx={{ px: 1.5 }}>
                  đ
                </ToggleButton>
                <ToggleButton value="$" sx={{ px: 1.5 }}>
                  $
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                {t('currencyNote')}
              </Typography>
            </Box>

            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setChangePasswordOpen(true);
              }}
            >
              {t('changePassword')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                handleLogout();
              }}
            >
              {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <List sx={{ width: 220 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileNavOpen(false)}
            >
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ p: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
