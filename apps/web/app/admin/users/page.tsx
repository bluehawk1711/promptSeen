"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserProfile } from "@repo/shared/types";

/**
 * Admin Users management page — view and manage admin users.
 */
export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc"))
      );
      setUsers(
        snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (user: UserProfile) => {
    setToggling(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isAdmin: !user.isAdmin,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );
    } catch (error) {
      console.error("Failed to toggle admin:", error);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} registered users, {users.filter((u) => u.isAdmin).length} admins
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No users yet. Users will appear here after signing up.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.displayName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAdmin(user)}
                        disabled={toggling === user.uid}
                      >
                        {user.isAdmin ? (
                          <ShieldOff size={14} className="mr-1" />
                        ) : (
                          <Shield size={14} className="mr-1" />
                        )}
                        {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
