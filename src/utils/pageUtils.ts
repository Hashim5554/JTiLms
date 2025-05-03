import { supabase } from '../lib/supabase';
import { 
  ComponentTypeInfo, 
  PageComponent, 
  CustomPage,
  ComponentConfig
} from '../types/pageComponents';

/**
 * Loads all custom pages
 */
export async function loadCustomPages(): Promise<{
  pages: CustomPage[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .order('title');

    if (error) throw error;
    
    return { pages: data || [] };
  } catch (error: any) {
    console.error('Error loading custom pages:', error);
    return { 
      pages: [], 
      error: error.message || 'Failed to load custom pages' 
    };
  }
}

/**
 * Loads a custom page by path with all its components
 */
export async function loadPageByPath(path: string): Promise<{
  page?: CustomPage;
  error?: string;
}> {
  try {
    // Get the page
    const { data: pageData, error: pageError } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('path', path)
      .single();
    
    if (pageError) throw pageError;
    if (!pageData) {
      return { error: 'Page not found' };
    }

    // Get components for the page
    const { data: componentsData, error: componentsError } = await supabase
      .from('page_components')
      .select(`
        *,
        component_type:component_type_id (
          id, name, description, icon, created_at, updated_at
        )
      `)
      .eq('page_id', pageData.id)
      .order('position');
    
    if (componentsError) throw componentsError;
    
    // Return the page with its components
    return { 
      page: {
        ...pageData,
        components: componentsData || []
      }
    };
  } catch (error: any) {
    console.error('Error loading page by path:', error);
    return { error: error.message || 'Failed to load page' };
  }
}

/**
 * Creates a new custom page
 */
export async function createCustomPage(
  title: string, 
  path: string, 
  config?: Partial<CustomPage['config']>
): Promise<{
  page?: CustomPage;
  error?: string;
}> {
  try {
    // Format path: lowercase, replace spaces with hyphens
    const formattedPath = path.toLowerCase().replace(/\s+/g, '-');
    
    // Default config
    const defaultConfig = {
      layout: 'standard',
      theme: 'default'
    };
    
    const { data, error } = await supabase
      .from('custom_pages')
      .insert([{
        title,
        path: formattedPath,
        config: config ? { ...defaultConfig, ...config } : defaultConfig
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return { page: data };
  } catch (error: any) {
    console.error('Error creating custom page:', error);
    return { error: error.message || 'Failed to create page' };
  }
}

/**
 * Updates a custom page
 */
export async function updateCustomPage(
  id: string,
  updates: Partial<CustomPage>
): Promise<{
  page?: CustomPage;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('custom_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { page: data };
  } catch (error: any) {
    console.error('Error updating custom page:', error);
    return { error: error.message || 'Failed to update page' };
  }
}

/**
 * Deletes a custom page
 */
export async function deleteCustomPage(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting custom page:', error);
    return { error: error.message || 'Failed to delete page' };
  }
}

/**
 * Loads all component types
 */
export async function loadComponentTypes(): Promise<{
  types: ComponentTypeInfo[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('component_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return { types: data || [] };
  } catch (error: any) {
    console.error('Error loading component types:', error);
    return { 
      types: [], 
      error: error.message || 'Failed to load component types' 
    };
  }
}

/**
 * Adds a component to a page
 */
export async function addPageComponent(
  pageId: string,
  componentTypeId: string,
  position: number,
  config: ComponentConfig
): Promise<{
  component?: PageComponent;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('page_components')
      .insert([{
        page_id: pageId,
        component_type_id: componentTypeId,
        position,
        config
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return { component: data };
  } catch (error: any) {
    console.error('Error adding page component:', error);
    return { error: error.message || 'Failed to add component' };
  }
}

/**
 * Updates a page component
 */
export async function updatePageComponent(
  id: string,
  updates: Partial<PageComponent>
): Promise<{
  component?: PageComponent;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('page_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { component: data };
  } catch (error: any) {
    console.error('Error updating page component:', error);
    return { error: error.message || 'Failed to update component' };
  }
}

/**
 * Deletes a page component
 */
export async function deletePageComponent(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('page_components')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting page component:', error);
    return { error: error.message || 'Failed to delete component' };
  }
}

/**
 * Reorders page components
 */
export async function reorderComponents(
  pageId: string, 
  componentIds: string[]
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    // Use a transaction to update all positions
    const updates = componentIds.map((id, index) => ({
      id,
      position: index
    }));
    
    // Update each component with its new position
    for (const update of updates) {
      const { error } = await supabase
        .from('page_components')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('page_id', pageId);
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering components:', error);
    return { error: error.message || 'Failed to reorder components' };
  }
} 