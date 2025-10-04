import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { 
  Menu, 
  User, 
  LogOut, 
  DollarSign, 
  FileText, 
  CheckSquare,
  Settings
} from 'lucide-react'

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { key: 'dashboard', label: 'Dashboard', icon: DollarSign },
    { key: 'expenses', label: 'Submit Expense', icon: FileText },
    { key: 'approvals', label: 'Approvals', icon: CheckSquare, roles: ['manager', 'admin'] },
    { key: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ]

  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || 'employee')
  )

  const handleNavigation = (page: string) => {
    onNavigate(page)
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.nav 
      className="bg-white shadow-lg border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DollarSign className="h-8 w-8 text-blue-600 mr-2" />
              <span className="font-bold text-xl text-gray-900">ExpenseManager</span>
            </motion.div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => handleNavigation(key)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </motion.button>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-1">
                    {filteredNavItems.map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        onClick={() => handleNavigation(key)}
                        variant={currentPage === key ? 'default' : 'ghost'}
                        className="w-full justify-start"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}