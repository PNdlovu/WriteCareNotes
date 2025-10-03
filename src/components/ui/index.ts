import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview UI Components Index for WriteCareNotes
 * @module UIComponents
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Central export point for all reusable UI components
 * providing a clean API for importing UI elements across the application.
 */

// Core UI Components
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardContent, CardHeader, CardTitle } from './Card';
export { Badge } from './Badge';
export { Alert, AlertDescription } from './Alert';
export { LoadingSpinner } from './LoadingSpinner';

// Layout and Navigation Components
export { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
export { DataTable } from './DataTable';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
export { Select, SelectOption } from './Select';

// Specialized Healthcare Components
export { BarcodeScanner } from './BarcodeScanner';
export { ElectronicSignature } from './ElectronicSignature';