'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  Shield,
  Layers,
  UserCheck,
  KeyRound,
  RefreshCw,
  Edit2,
  Eye,
  EyeOff,
  Lock,
  UserCog,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  companyEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  employmentType: string;
  workLocation: string;
  shift: string;
  status: string;
  basicSalary: number;
  grossSalary: number;
  joiningDate: string;
  department?: { id: string; name: string; code: string | null } | null;
  team?: { id: string; name: string; code: string | null } | null;
  designation?: { id: string; title: string } | null;
  appRole?: { id: string; name: string; displayName: string } | null;
  manager?: { id: string; name: string; employeeCode: string } | null;
  user?: { id: string; email: string; role: string; status: string; appRoleId?: string | null; mustChangePassword?: boolean } | null;
  businessUnits?: {
    businessUnitId: string;
    businessUnit?: { id: string; code: string; name: string } | null;
  }[];
}

interface DepartmentSimple {
  id: string;
  name: string;
  code: string | null;
  teams: { id: string; name: string; code: string | null }[];
}

interface RoleSimple {
  id: string;
  name: string;
  displayName: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentSimple[]>([]);
  const [roles, setRoles] = useState<RoleSimple[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit BU modal state
  const [editEmployeeTarget, setEditEmployeeTarget] = useState<Employee | null>(null);
  const [editBuId, setEditBuId] = useState('');
  const [savingBu, setSavingBu] = useState(false);

  // Edit Employee comprehensive modal state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    companyEmail: '',
    personalEmail: '',
    phone: '',
    departmentId: '',
    teamId: '',
    businessUnitId: '',
    designationId: '',
    designationTitle: '',
    appRoleId: '',
    managerId: '',
    employmentType: 'FULL_TIME',
    workLocation: 'HYBRID',
    status: 'ACTIVE',
    shift: 'REGULAR_DAY',
    basicSalary: '45000',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    // User login & password
    hasLogin: false,
    createLoginUser: false,
    newPassword: '',
    userStatus: 'ACTIVE',
    mustChangePassword: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editTab, setEditTab] = useState<'profile' | 'role' | 'login' | 'employment'>('profile');

  const [form, setForm] = useState({
    name: '',
    companyEmail: '',
    personalEmail: '',
    phone: '',
    departmentId: '',
    teamId: '',
    businessUnitId: '',
    designationTitle: '',
    appRoleId: '',
    managerId: '',
    employmentType: 'FULL_TIME',
    workLocation: 'HYBRID',
    shift: 'REGULAR_DAY',
    basicSalary: '45000',
    hra: '18000',
    allowances: '7000',
    probationMonths: '3',
    createLoginUser: true,
    loginPassword: 'TechInPedia@2026',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const url = new URL('/api/hr/employees', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (deptFilter) url.searchParams.set('departmentId', deptFilter);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      if (buFilter) url.searchParams.set('businessUnitId', buFilter);

      const [empRes, deptRes, rolesRes, buRes] = await Promise.all([
        fetch(url.toString()),
        fetch('/api/hr/departments'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/business-units'),
      ]);

      const empData = await empRes.json();
      const deptData = await deptRes.json();
      const rolesData = await rolesRes.json();
      const buData = await buRes.json();

      if (empRes.ok) setEmployees(empData.employees || []);
      if (deptRes.ok) setDepartments(deptData.departments || []);
      if (rolesRes.ok) setRoles(rolesData.roles || []);
      if (buRes.ok) setBusinessUnits(buData.businessUnits || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, deptFilter, statusFilter, buFilter]);

  const selectedDeptObj = departments.find((d) => d.id === form.departmentId);
  const availableTeams = selectedDeptObj?.teams || [];

  const editDeptObj = departments.find((d) => d.id === editForm.departmentId);
  const availableEditTeams = editDeptObj?.teams || [];

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditError(null);
    setEditSuccess(false);
    setShowPassword(false);
    setEditTab('profile');
    setEditForm({
      name: emp.name || '',
      companyEmail: emp.companyEmail || '',
      personalEmail: emp.personalEmail || '',
      phone: emp.phone || '',
      departmentId: emp.department?.id || '',
      teamId: emp.team?.id || '',
      businessUnitId: emp.businessUnits?.[0]?.businessUnitId || '',
      designationId: emp.designation?.id || '',
      designationTitle: emp.designation?.title || '',
      appRoleId: emp.appRole?.id || emp.user?.appRoleId || '',
      managerId: emp.manager?.id || '',
      employmentType: emp.employmentType || 'FULL_TIME',
      workLocation: emp.workLocation || 'HYBRID',
      status: emp.status || 'ACTIVE',
      shift: emp.shift || 'REGULAR_DAY',
      basicSalary: String(emp.basicSalary || emp.grossSalary || 45000),
      emergencyContactName: (emp as any).emergencyContactName || '',
      emergencyContactPhone: (emp as any).emergencyContactPhone || '',
      emergencyContactRelation: (emp as any).emergencyContactRelation || '',
      hasLogin: !!emp.user,
      createLoginUser: false,
      newPassword: '',
      userStatus: emp.user?.status || 'ACTIVE',
      mustChangePassword: !!emp.user?.mustChangePassword,
    });
  };

  const handleSaveEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const payload: any = {
        name: editForm.name?.trim(),
        companyEmail: editForm.companyEmail?.trim().toLowerCase(),
        personalEmail: editForm.personalEmail?.trim() ? editForm.personalEmail.trim().toLowerCase() : null,
        phone: editForm.phone?.trim() ? editForm.phone.trim() : null,
        departmentId: editForm.departmentId || null,
        teamId: editForm.teamId || null,
        designationId: editForm.designationId || null,
        designationTitle: editForm.designationTitle?.trim() || null,
        appRoleId: editForm.appRoleId || null,
        managerId: editForm.managerId || null,
        businessUnitId: editForm.businessUnitId || null,
        employmentType: editForm.employmentType,
        workLocation: editForm.workLocation,
        status: editForm.status,
        shift: editForm.shift,
        basicSalary: parseFloat(editForm.basicSalary) || 0,
        emergencyContactName: editForm.emergencyContactName?.trim() || null,
        emergencyContactPhone: editForm.emergencyContactPhone?.trim() || null,
        emergencyContactRelation: editForm.emergencyContactRelation?.trim() || null,
        userStatus: editForm.userStatus,
        mustChangePassword: editForm.mustChangePassword,
      };

      if (editForm.newPassword?.trim()) {
        payload.password = editForm.newPassword.trim();
      }
      if (!editForm.hasLogin && editForm.createLoginUser) {
        payload.createLoginUser = true;
        if (!payload.password) {
          payload.password = 'TechInPedia@2026';
        }
      }

      const res = await fetch(`/api/hr/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update employee');

      setEditSuccess(true);
      setTimeout(() => {
        setEditingEmployee(null);
        setEditSuccess(false);
      }, 1200);
      await fetchData();
    } catch (err: any) {
      setEditError(err.message || 'Error updating employee');
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditEmployeeBu = (emp: Employee) => {
    setEditEmployeeTarget(emp);
    const currentBuId = emp.businessUnits?.[0]?.businessUnitId || '';
    setEditBuId(currentBuId);
  };

  const handleSaveEmployeeBu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeTarget) return;
    setSavingBu(true);
    try {
      const res = await fetch(`/api/hr/employees/${editEmployeeTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId: editBuId || null,
        }),
      });
      if (res.ok) {
        setEditEmployeeTarget(null);
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update employee business unit');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating business unit');
    } finally {
      setSavingBu(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard employee');

      setShowCreateModal(false);
      setForm({
        name: '',
        companyEmail: '',
        personalEmail: '',
        phone: '',
        departmentId: '',
        teamId: '',
        businessUnitId: '',
        designationTitle: '',
        appRoleId: '',
        managerId: '',
        employmentType: 'FULL_TIME',
        workLocation: 'HYBRID',
        shift: 'REGULAR_DAY',
        basicSalary: '45000',
        hra: '18000',
        allowances: '7000',
        probationMonths: '3',
        createLoginUser: true,
        loginPassword: 'TechInPedia@2026',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Directory
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Staff OS
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personnel profiles, organizational hierarchy, reporting lines, and linked user accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/roles"
            className="px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Roles & Permissions
          </Link>
          <Link
            href="/admin/hr/departments"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Departments & Teams
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Onboard Employee
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Headcount
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {employees.length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Active Core Staff
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {employees.filter((e) => e.status === 'ACTIVE').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Linked User Logins
          </span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
            {employees.filter((e) => e.user).length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            In Probation
          </span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {employees.filter((e) => e.status === 'PROBATION').length}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="">All Business Units</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Employee & ID</th>
                <th className="px-5 py-3">Business Unit</th>
                <th className="px-5 py-3">Department & Team</th>
                <th className="px-5 py-3">Role & Designation</th>
                <th className="px-5 py-3">Reporting Manager</th>
                <th className="px-5 py-3">Account Status</th>
                <th className="px-5 py-3">Gross Salary</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs">Loading employee directory...</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No employees found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Onboard your company staff to establish organizational reporting lines and self-service.
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Employee & Code */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {emp.name}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          {emp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                          {emp.employeeCode}
                        </span>
                        <span>{emp.companyEmail}</span>
                      </div>
                    </td>

                    {/* Business Unit */}
                    <td className="px-5 py-3.5 text-xs">
                      {emp.businessUnits && emp.businessUnits.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {emp.businessUnits.map((ebu) => (
                            <span
                              key={ebu.businessUnitId}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                ebu.businessUnit?.code === 'MARKETPLACE'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                              }`}
                            >
                              {ebu.businessUnit?.name || ebu.businessUnit?.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">All / Unassigned</span>
                      )}
                    </td>

                    {/* Department & Team */}
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {emp.department?.name || 'Unassigned Dept'}
                      </div>
                      <span className="text-slate-400 text-[11px] block">
                        Team: {emp.team?.name || 'General Pool'}
                      </span>
                    </td>

                    {/* Role & Designation */}
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {emp.appRole?.displayName || 'Standard Staff'}
                      </div>
                      <span className="text-slate-400 text-[11px] block">
                        {emp.designation?.title || 'Team Member'}
                      </span>
                    </td>

                    {/* Manager */}
                    <td className="px-5 py-3.5 text-xs">
                      {emp.manager ? (
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {emp.manager.name}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] block">
                            {emp.manager.employeeCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None (Direct Head)</span>
                      )}
                    </td>

                    {/* Login Account */}
                    <td className="px-5 py-3.5 text-xs">
                      {emp.user ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          <UserCheck className="w-3 h-3" />
                          Login Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Profile Only
                        </span>
                      )}
                    </td>

                    {/* Compensation */}
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-white">
                      ₹{(emp.grossSalary || emp.basicSalary).toLocaleString('en-IN')}/mo
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditEmployee(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-xs"
                          title="Edit Profile, Role, Department & Password"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => openEditEmployeeBu(emp)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                          title="Assign Business Unit"
                        >
                          BU
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Onboard Company Staff
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 mt-4 text-xs">
              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. Contact & Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Official Company Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.companyEmail}
                      onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      placeholder="rahul@techinpedia.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Personal Email
                    </label>
                    <input
                      type="email"
                      value={form.personalEmail}
                      onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      placeholder="rahul.personal@gmail.com"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Hierarchy */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Organization Hierarchy & Role
                </h4>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Business Unit Assignment
                  </label>
                  <select
                    value={form.businessUnitId}
                    onChange={(e) => setForm({ ...form, businessUnitId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- All / General Access --</option>
                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name} ({bu.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Associates staff with a dedicated business unit (e.g. Marketplace, Company Services).
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Department
                    </label>
                    <select
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value, teamId: '' })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Operational Team
                    </label>
                    <select
                      value={form.teamId}
                      onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- General Department Pool --</option>
                      {availableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.code ? `(${t.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      System / Business Role
                    </label>
                    <select
                      value={form.appRoleId}
                      onChange={(e) => setForm({ ...form, appRoleId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.displayName} ({r.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Reporting Manager
                    </label>
                    <select
                      value={form.managerId}
                      onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Direct to Management / Department Head --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation & Work Policy */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3. Compensation & Shift
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Basic Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={form.basicSalary}
                      onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      HRA (₹)
                    </label>
                    <input
                      type="number"
                      value={form.hra}
                      onChange={(e) => setForm({ ...form, hra: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Allowances (₹)
                    </label>
                    <input
                      type="number"
                      value={form.allowances}
                      onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Work Location
                    </label>
                    <select
                      value={form.workLocation}
                      onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="HYBRID">Hybrid (Delhi NCR)</option>
                      <option value="ON_SITE">On-Site Office</option>
                      <option value="REMOTE">Fully Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Working Shift
                    </label>
                    <select
                      value={form.shift}
                      onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="REGULAR_DAY">Regular Day (09:30 AM - 06:30 PM)</option>
                      <option value="MORNING">Morning (08:00 AM - 05:00 PM)</option>
                      <option value="EVENING">Evening (02:00 PM - 11:00 PM)</option>
                      <option value="NIGHT">Night (09:00 PM - 06:00 AM)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* User Account Link */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createLoginUser"
                    checked={form.createLoginUser}
                    onChange={(e) => setForm({ ...form, createLoginUser: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="createLoginUser" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    Provision User Login Account
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                  Automatically creates an authenticated login user in the database linked to this employee profile.
                </p>

                {form.createLoginUser && (
                  <div className="pt-2 pl-6">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Password
                    </label>
                    <input
                      type="text"
                      value={form.loginPassword}
                      onChange={(e) => setForm({ ...form, loginPassword: e.target.value })}
                      className="w-full sm:w-64 p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {creating ? 'Onboarding...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Business Unit Modal */}
      {editEmployeeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-600" />
                Assign Business Unit
              </h3>
              <button
                onClick={() => setEditEmployeeTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeBu} className="space-y-4 mt-4 text-xs">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {editEmployeeTarget.name}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {editEmployeeTarget.employeeCode} • {editEmployeeTarget.companyEmail}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Business Unit
                </label>
                <select
                  value={editBuId}
                  onChange={(e) => setEditBuId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-sm"
                >
                  <option value="">-- All / General Access --</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>
                      {bu.name} ({bu.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Restricts lead auto-assignment and CRM access to this business unit only.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditEmployeeTarget(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBu}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingBu ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-emerald-500" />
                  Edit Employee Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {editingEmployee.employeeCode} • {editingEmployee.companyEmail}
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {editError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            {editSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Employee details updated successfully!</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pt-3 pb-2 flex-shrink-0 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditTab('profile')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  editTab === 'profile'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Profile & Hierarchy
              </button>
              <button
                type="button"
                onClick={() => setEditTab('role')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  editTab === 'role'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Role & Access
              </button>
              <button
                type="button"
                onClick={() => setEditTab('login')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  editTab === 'login'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Login & Password
              </button>
              <button
                type="button"
                onClick={() => setEditTab('employment')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  editTab === 'employment'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Employment & Salary
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditEmployee} className="space-y-4 mt-4 text-xs flex-1 overflow-y-auto pr-1">
              {/* Tab 1: Profile & Hierarchy */}
              {editTab === 'profile' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Himanshu Arora"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Official Company Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.companyEmail}
                        onChange={(e) => setEditForm({ ...editForm, companyEmail: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-mono"
                        placeholder="sales@techinpedia.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        value={editForm.personalEmail}
                        onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                        placeholder="personal@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Department
                      </label>
                      <select
                        value={editForm.departmentId}
                        onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value, teamId: '' })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">-- Unassigned Department --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.code ? `(${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Team
                      </label>
                      <select
                        value={editForm.teamId}
                        onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })}
                        disabled={!editForm.departmentId}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      >
                        <option value="">-- General Pool --</option>
                        {availableEditTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Designation Title
                      </label>
                      <input
                        type="text"
                        value={editForm.designationTitle}
                        onChange={(e) => setEditForm({ ...editForm, designationTitle: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Senior Sales Consultant"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Reporting Line Manager
                      </label>
                      <select
                        value={editForm.managerId}
                        onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">-- None (Reports to Head) --</option>
                        {employees
                          .filter((e) => e.id !== editingEmployee.id)
                          .map((mgr) => (
                            <option key={mgr.id} value={mgr.id}>
                              {mgr.name} ({mgr.employeeCode})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Business Unit
                    </label>
                    <select
                      value={editForm.businessUnitId}
                      onChange={(e) => setEditForm({ ...editForm, businessUnitId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Global / All Business Units --</option>
                      {businessUnits.map((bu) => (
                        <option key={bu.id} value={bu.id}>
                          {bu.name} ({bu.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 2: Role & Permissions */}
              {editTab === 'role' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Role-Based Access Control (RBAC)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Assigning an AppRole governs which modules, navigation sections, and API endpoints this employee can access. Changes apply immediately upon their next action or login.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Assigned AppRole *
                    </label>
                    <select
                      value={editForm.appRoleId}
                      onChange={(e) => setEditForm({ ...editForm, appRoleId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Standard Staff (Self-Service ESS Only) --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.displayName} ({r.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {editForm.appRoleId ? (
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                        Active AppRole Configured
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {roles.find((r) => r.id === editForm.appRoleId)?.displayName || 'Selected Role'}
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/admin/roles"
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Inspect & Customize Permissions for this Role in Studio ➔
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                      No AppRole selected. This employee will only have baseline self-service portal access (clock in/out, personal leaves).
                    </p>
                  )}
                </div>
              )}

              {/* Tab 3: Login & Password */}
              {editTab === 'login' && (
                <div className="space-y-4">
                  {editForm.hasLogin ? (
                    <div className="space-y-3.5">
                      <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                            <UserCheck className="w-4 h-4" />
                            Active Login Account
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {editingEmployee.user?.email || editingEmployee.companyEmail}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {editForm.userStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                            User Account Status
                          </label>
                          <select
                            value={editForm.userStatus}
                            onChange={(e) => setEditForm({ ...editForm, userStatus: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="ACTIVE">ACTIVE (Can Authenticate)</option>
                            <option value="INACTIVE">INACTIVE (Locked Out)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                            Force Password Change
                          </label>
                          <div className="mt-2.5 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="mustChangePassword"
                              checked={editForm.mustChangePassword}
                              onChange={(e) => setEditForm({ ...editForm, mustChangePassword: e.target.checked })}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <label htmlFor="mustChangePassword" className="text-xs text-slate-600 dark:text-slate-300">
                              Require password reset upon next login
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                          <span>Reset Login Password</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Leave blank to keep current password
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={editForm.newPassword}
                            onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                            className="w-full p-2.5 pr-10 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                            placeholder="Enter new secure password (min 8 chars)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Setting a new password updates their credentials across Web Portal and Mobile App immediately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                          <Lock className="w-4 h-4 text-amber-500" />
                          No Login Account Provisioned
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          This employee currently exists as an HR directory record only without system login credentials.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                        <label className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.createLoginUser}
                            onChange={(e) => setEditForm({ ...editForm, createLoginUser: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>Provision User Login Account Now</span>
                        </label>

                        {editForm.createLoginUser && (
                          <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                            <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              Initial Login Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={editForm.newPassword}
                                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                                className="w-full p-2.5 pr-10 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                                placeholder="e.g. TechInPedia@2026"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Login username will be: <span className="font-mono text-emerald-600 dark:text-emerald-400">{editForm.companyEmail}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Employment & Compensation */}
              {editTab === 'employment' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Employment Type
                      </label>
                      <select
                        value={editForm.employmentType}
                        onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contractor / Consultant</option>
                        <option value="INTERN">Intern</option>
                        <option value="FREELANCER">Freelancer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Work Location
                      </label>
                      <select
                        value={editForm.workLocation}
                        onChange={(e) => setEditForm({ ...editForm, workLocation: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="HYBRID">Hybrid</option>
                        <option value="ON_SITE">On-Site (Office)</option>
                        <option value="REMOTE">Remote (Work from Home)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Lifecycle Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PROBATION">Probation</option>
                        <option value="NOTICE_PERIOD">Notice Period</option>
                        <option value="RESIGNED">Resigned</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Assigned Shift
                      </label>
                      <select
                        value={editForm.shift}
                        onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="REGULAR_DAY">Regular Day (10:00 AM - 7:00 PM)</option>
                        <option value="MORNING">Morning Shift (8:00 AM - 5:00 PM)</option>
                        <option value="EVENING">Evening Shift (2:00 PM - 11:00 PM)</option>
                        <option value="NIGHT">Night Shift (8:00 PM - 5:00 AM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Monthly Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={editForm.basicSalary}
                      onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Emergency Contact
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={editForm.emergencyContactName}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                        className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={editForm.emergencyContactPhone}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                        className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Relation (e.g. Spouse)"
                        value={editForm.emergencyContactRelation}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactRelation: e.target.value })}
                        className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Updates...
                    </>
                  ) : (
                    'Save Employee Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
