/**
 * @fileoverview Main Layout Component
 * @module MainLayout
 * @version 1.0.0
 * @description Main application layout with navigation and healthcare-specific features
 */

import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  LocalPharmacy,
  Assignment,
  Security,
  Group,
  Assessment,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  MedicalServices,
  EventNote,
  Warning,
  LocalHospital
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { RootState, AppDispatch } from '@store/store'
import { logout } from '@store/slices/authSlice'
import { NotificationCenter } from '@components/NotificationCenter'
import { QuickActions } from '@components/QuickActions'
import { EmergencyAlert } from '@components/EmergencyAlert'

const drawerWidth = 280

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path: string
  permission?: string
  badge?: number
  color?: string
}

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  
  const { user, permissions } = useSelector((state: RootState) => state.auth)
  const { urgentNotifications } = useSelector((state: RootState) => state.notifications)
  const { emergencyAlerts } = useSelector((state: RootState) => state.emergency)
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)

  // Navigation items with healthcare focus
  const navigationItems: NavigationItem[] = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard'
    },
    {
      text: 'Residents',
      icon: <People />,
      path: '/residents',
      permission: 'residents.view'
    },
    {
      text: 'Medication',
      icon: <LocalPharmacy />,
      path: '/medication',
      permission: 'medication.view',
      badge: urgentNotifications?.medicationAlerts || 0,
      color: '#f44336'
    },
    {
      text: 'Care Notes',
      icon: <Assignment />,
      path: '/care-notes',
      permission: 'care_notes.view'
    },
    {
      text: 'Care Plans',
      icon: <EventNote />,
      path: '/care-plans',
      permission: 'care_plans.view'
    },
    {
      text: 'Medical Records',
      icon: <MedicalServices />,
      path: '/medical-records',
      permission: 'medical_records.view'
    },
    {
      text: 'Risk Assessments',
      icon: <Warning />,
      path: '/risk-assessments',
      permission: 'risk_assessments.view',
      badge: urgentNotifications?.riskAlerts || 0,
      color: '#ff9800'
    },
    {
      text: 'Incidents',
      icon: <LocalHospital />,
      path: '/incidents',
      permission: 'incidents.view'
    },
    {
      text: 'Compliance',
      icon: <Security />,
      path: '/compliance',
      permission: 'compliance.view'
    },
    {
      text: 'Staff',
      icon: <Group />,
      path: '/staff',
      permission: 'staff.view'
    },
    {
      text: 'Reports',
      icon: <Assessment />,
      path: '/reports',
      permission: 'reports.view'
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings'
    }
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleProfileMenuClose()
    await dispatch(logout())
    navigate('/login')
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true
    return permissions.includes(permission) || permissions.includes('admin')
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%">
          <LocalHospital color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div" color="primary">
            WriteCareNotes
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Emergency Alerts */}
      {emergencyAlerts && emergencyAlerts.length > 0 && (
        <Box p={1}>
          <EmergencyAlert alerts={emergencyAlerts} />
        </Box>
      )}
      
      <List>
        {navigationItems
          .filter(item => hasPermission(item.permission))
          .map((item) => (
            <ListItem
              key={item.text}
              button
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  }
                }
              }}
            >
              <ListItemIcon>
                <Badge
                  badgeContent={item.badge}
                  color={item.color === '#f44336' ? 'error' : 'warning'}
                  invisible={!item.badge}
                >
                  {item.icon}
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname.startsWith(item.path) ? 600 : 400
                }}
              />
            </ListItem>
          ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => location.pathname.startsWith(item.path))?.text || 'Dashboard'}
          </Typography>

          {/* Quick Actions */}
          <QuickActions />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={() => setNotificationOpen(true)}
            >
              <Badge badgeContent={urgentNotifications?.total || 0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title="Account">
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              {user?.profileImage ? (
                <Avatar src={user.profileImage} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  )
}