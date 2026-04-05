// stores/auth.store.js
import { defineStore } from 'pinia'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    isLoading: false
  }),

  actions: {
    // Регистрация
    async signUp(email, password, username) {
      this.isLoading = true
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          // Создание профиля
          await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                username,
                created_at: new Date().toISOString()
              }
            ])
          
          this.user = data.user
        }
        
        return { success: true, data }
      } catch (error) {
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Вход
    async signIn(email, password) {
      this.isLoading = true
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        this.user = data.user
        
        // Загрузка профиля
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        this.profile = profile
        
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Выход
    async signOut() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        this.user = null
        this.profile = null
        
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    // Проверка текущей сессии
    async checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          this.user = user
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          this.profile = profile
        }
      } catch (error) {
        console.error('Ошибка проверки аутентификации:', error)
      }
    }
  }
})