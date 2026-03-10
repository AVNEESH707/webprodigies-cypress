'use server';
import { validate } from 'uuid';
import { files, folders, users, workspaces, subscriptions, products, prices } from '../../../migrations/schema';
import db from './db';
import { File, Folder, Subscription, User, workspace } from './supabase.types';
import { and, eq, ilike, notExists } from 'drizzle-orm';
import { collaborators } from './schema';
import { revalidatePath } from 'next/cache';
import { withTimeout } from '../utils/timeout';

export const createWorkspace = async (workspace: workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  if (!workspaceId) return;
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
};

export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await withTimeout(
      db.query.subscriptions.findFirst({
        where: (s, { eq }) => eq(s.userId, userId),
      }),
      5000,
      null
    );
    if (data) return { data: data as Subscription, error: null };
    else return { data: null, error: null };
  } catch (error) {
    console.log('Error fetching subscription:', error);
    // Return null instead of throwing to allow app to continue
    return { data: null, error: null };
  }
};

export const getFolders = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: null,
      error: 'Error',
    };

  try {
    const results: Folder[] | null = await withTimeout(
      db
        .select()
        .from(folders)
        .orderBy(folders.createdAt)
        .where(eq(folders.workspaceId, workspaceId)),
      5000,
      []
    );
    return { data: results || [], error: null };
  } catch (error) {
    console.log('Error fetching folders:', error);
    return { data: null, error: 'Error' };
  }
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: [],
      error: 'Error',
    };

  try {
    const response = (await withTimeout(
      db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1),
      5000,
      []
    )) as workspace[];
    return { data: response || [], error: null };
  } catch (error) {
    console.log('Error fetching workspace details:', error);
    return { data: [], error: 'Error' };
  }
};

export const getFileDetails = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) {
    return {
      data: [],
      error: 'Error',
    };
  }
  try {
    const response = (await withTimeout(
      db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1),
      5000,
      []
    )) as File[];
    return { data: response || [], error: null };
  } catch (error) {
    console.log('Error fetching file details:', error);
    return { data: [], error: 'Error' };
  }
};

export const deleteFile = async (fileId: string) => {
  if (!fileId) return;
  await db.delete(files).where(eq(files.id, fileId));
};

export const deleteFolder = async (folderId: string) => {
  if (!folderId) return;
  await db.delete(files).where(eq(files.id, folderId));
};

export const getFolderDetails = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) {
    return {
      data: [],
      error: 'Error',
    };
  }

  try {
    const response = (await withTimeout(
      db
        .select()
        .from(folders)
        .where(eq(folders.id, folderId))
        .limit(1),
      5000,
      []
    )) as Folder[];

    return { data: response || [], error: null };
  } catch (error) {
    console.log('Error fetching folder details:', error);
    return { data: [], error: 'Error' };
  }
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  try {
    const privateWorkspaces = (await withTimeout(
      db
        .select({
          id: workspaces.id,
          createdAt: workspaces.createdAt,
          workspaceOwner: workspaces.workspaceOwner,
          title: workspaces.title,
          iconId: workspaces.iconId,
          data: workspaces.data,
          inTrash: workspaces.inTrash,
          logo: workspaces.logo,
          bannerUrl: workspaces.bannerUrl,
        })
        .from(workspaces)
        .where(
          and(
            notExists(
              db
                .select()
                .from(collaborators)
                .where(eq(collaborators.workspaceId, workspaces.id))
            ),
            eq(workspaces.workspaceOwner, userId)
          )
        ),
      5000,
      []
    )) as workspace[];
    return privateWorkspaces || [];
  } catch (error) {
    console.log('Error fetching private workspaces:', error);
    return [];
  }
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  try {
    const collaboratedWorkspaces = (await withTimeout(
      db
        .select({
          id: workspaces.id,
          createdAt: workspaces.createdAt,
          workspaceOwner: workspaces.workspaceOwner,
          title: workspaces.title,
          iconId: workspaces.iconId,
          data: workspaces.data,
          inTrash: workspaces.inTrash,
          logo: workspaces.logo,
          bannerUrl: workspaces.bannerUrl,
        })
        .from(users)
        .innerJoin(collaborators, eq(users.id, collaborators.userId))
        .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
        .where(eq(users.id, userId)),
      5000,
      []
    )) as workspace[];
    return collaboratedWorkspaces || [];
  } catch (error) {
    console.log('Error fetching collaborating workspaces:', error);
    return [];
  }
};

export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  try {
    const sharedWorkspaces = (await withTimeout(
      db
        .selectDistinct({
          id: workspaces.id,
          createdAt: workspaces.createdAt,
          workspaceOwner: workspaces.workspaceOwner,
          title: workspaces.title,
          iconId: workspaces.iconId,
          data: workspaces.data,
          inTrash: workspaces.inTrash,
          logo: workspaces.logo,
          bannerUrl: workspaces.bannerUrl,
        })
        .from(workspaces)
        .orderBy(workspaces.createdAt)
        .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
        .where(eq(workspaces.workspaceOwner, userId)),
      5000,
      []
    )) as workspace[];
    return sharedWorkspaces || [];
  } catch (error) {
    console.log('Error fetching shared workspaces:', error);
    return [];
  }
};

export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: 'Error' };
  try {
    const results = (await withTimeout(
      db
        .select()
        .from(files)
        .orderBy(files.createdAt)
        .where(eq(files.folderId, folderId)),
      5000,
      []
    )) as File[] | [];
    return { data: results || [], error: null };
  } catch (error) {
    console.log('Error fetching files:', error);
    return { data: null, error: 'Error' };
  }
};

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });
    if (!userExists)
      await db.insert(collaborators).values({ workspaceId, userId: user.id });
  });
};

export const removeCollaborators = async (
  users: User[],
  workspaceId: string
) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });
    if (userExists)
      await db
        .delete(collaborators)
        .where(
          and(
            eq(collaborators.workspaceId, workspaceId),
            eq(collaborators.userId, user.id)
          )
        );
  });
};

export const findUser = async (userId: string) => {
  const response = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  return response;
};

export const getActiveProductsWithPrice = async () => {
  try {
    const res = await db.query.products.findMany({
      where: (pro, { eq }) => eq(pro.active, true),

      with: {
        prices: {
          where: (pri, { eq }) => eq(pri.active, true),
        },
      },
    });
    if (res.length) return { data: res, error: null };
    return { data: [], error: null };
  } catch (error) {
    console.log('Stripe tables missing. Skipping products fetch.');
    // Return empty array instead of throwing to allow app to continue
    return { data: [], error: null };
  }
};

export const createFolder = async (folder: Folder) => {
  try {
    const results = await db.insert(folders).values(folder);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const createFile = async (file: File) => {
  try {
    await db.insert(files).values(file);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  try {
    await db.update(folders).set(folder).where(eq(folders.id, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateFile = async (file: Partial<File>, fileId: string) => {
  try {
    const response = await db
      .update(files)
      .set(file)
      .where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateWorkspace = async (
  workspace: Partial<workspace>,
  workspaceId: string
) => {
  if (!workspaceId) return;
  try {
    await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, workspaceId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const getCollaborators = async (workspaceId: string) => {
  const response = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId, workspaceId));
  if (!response.length) return [];
  const userInformation: Promise<User | undefined>[] = response.map(
    async (user) => {
      const exists = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.userId),
      });
      return exists;
    }
  );
  const resolvedUsers = await Promise.all(userInformation);
  return resolvedUsers.filter(Boolean) as User[];
};

export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];
  const accounts = db
    .select()
    .from(users)
    .where(ilike(users.email, `${email}%`));
  return accounts;
};
