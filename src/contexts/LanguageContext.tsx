
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type TranslationMap = Record<string, string>; // { key: translation }
type AllTranslations = Record<string, TranslationMap>; // { langCode: TranslationMap }

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  getTranslation: (key: string, defaultText: string) => string;
  translations: AllTranslations;
  isInitializing: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CURRENT_LANGUAGE_KEY = 'forumverse_current_language';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];
export { SUPPORTED_LANGUAGES };

const PREDEFINED_TRANSLATIONS: AllTranslations = {
  en: {
    'navbar.createPost': 'Create Thread',
    'navbar.changeLanguage': 'Change language',
    'navbar.selectLanguage': 'Select Language',
    'navbar.logout': 'Log out',
    'navbar.login': 'Login',
    'navbar.signup': 'Sign Up',
    'navbar.myProfile': 'My Profile',

    'home.popularThreads': 'Popular Threads',
    'home.createThreadButton': 'Create New Thread',
    'home.loadingThreads': 'Loading threads...',
    'home.noThreads': 'No threads yet.',
    'home.beTheFirst': 'Be the first to start a discussion!',

    'loginPage.title': 'Welcome Back!',
    'loginPage.description': 'Log in to continue to ForumVerse.',
    'loginPage.emailLabel': 'Email',
    'loginPage.passwordLabel': 'Password',
    'loginPage.demoHint': 'For demo, try: alice@example.com / password123',
    'loginPage.loginButton': 'Log In',
    'loginPage.loggingInButton': 'Logging in...',
    'loginPage.signupPrompt': "Don't have an account?",
    'loginPage.signupLink': 'Sign up',

    'signupPage.title': 'Create an Account',
    'signupPage.description': 'Join ForumVerse today!',
    'signupPage.emailLabel': 'Email',
    'signupPage.usernameLabel': 'Username',
    'signupPage.displayNameLabel': 'Display Name (Optional)',
    'signupPage.passwordLabel': 'Password',
    'signupPage.confirmPasswordLabel': 'Confirm Password',
    'signupPage.signupButton': 'Sign Up',
    'signupPage.signingUpButton': 'Signing up...',
    'signupPage.loginPrompt': 'Already have an account?',
    'signupPage.loginLink': 'Log in',

    'submitPage.title': 'Create a new thread',
    'submitPage.description': 'Share your thoughts with the ForumVerse community.',
    'submitPage.titleLabel': 'Title',
    'submitPage.titlePlaceholder': 'Enter a descriptive title',
    'submitPage.contentLabel': 'Content',
    'submitPage.contentPlaceholder': 'Share your thoughts (Markdown not supported yet)',
    'submitPage.contentPlaceholderMarkdown': 'Share your thoughts (Markdown supported!)',
    'submitPage.createButton': 'Create Thread',
    'submitPage.submittingButton': 'Submitting...',
    'submitPage.loginPrompt': 'Please log in to create a thread.',

    'notFoundPage.title': 'Page Not Found',
    'notFoundPage.description': "Oops! The page you're looking for doesn't seem to exist.",
    'notFoundPage.homeButton': 'Return Home',
    'notFoundPage.userNotFoundTitle': 'User Not Found',
    'notFoundPage.userNotFoundDescription': "Sorry, we couldn't find a user with that username.",

    'threadPage.commentsHeading': 'Comments',

    'commentSection.leaveComment': 'Leave a comment',
    'commentSection.noComments': 'No comments yet. Be the first to share your thoughts!',

    'commentForm.replyPlaceholder': 'Write a reply...',
    'commentForm.commentPlaceholder': 'What are your thoughts?',
    'commentForm.loginPrompt': 'Please log in to comment.',
    'commentForm.replyButton': 'Reply',
    'commentForm.replyingButton': 'Replying...',
    'commentForm.commentButton': 'Comment',
    'commentForm.commentingButton': 'Commenting...',

    'summarizeButton.buttonText': 'Summarize Thread',
    'summarizeButton.buttonLoadingText': 'Summarizing...',
    'summarizeButton.dialogTitlePrefix': 'Summary of:',
    'summarizeButton.dialogDescription': 'AI-generated summary of the key points:',
    'summarizeButton.dialogLoadingSummary': 'Loading summary...',
    'summarizeButton.dialogCloseButton': 'Close',
    
    'threadItem.commentsLink': 'Comments',
    'threadItem.postedBy': 'Posted by',
    'threadView.postedBy': 'Posted by', 

    'commentItem.replyButton': 'Reply',

    'toast.loginSuccessTitle': 'Login Successful',
    'toast.loginSuccessDescription': 'Welcome back!',
    'toast.loginFailedTitle': 'Login Failed',
    'toast.loginFailedDescription': "Invalid email or password. Try 'alice@example.com' with 'password123'.",
    'toast.signupSuccessTitle': 'Signup Successful',
    'toast.signupSuccessDescription': 'Welcome to ForumVerse! You are now logged in.',
    'toast.signupFailedTitle': 'Signup Failed',
    'toast.signupFailedDescription': 'This email or username might already be in use or an error occurred.',
    'toast.authErrorTitle': 'Authentication Error',
    'toast.authErrorDescriptionCreatePost': 'You must be logged in to create a thread.',
    'toast.authErrorDescriptionComment': 'You must be logged in to comment.',
    'toast.errorCreatingPostTitle': 'Error creating thread',
    'toast.postCreatedTitle': 'Thread created!',
    'toast.postCreatedDescription': 'Your thread has been successfully created.',
    'toast.errorPostingCommentTitle': 'Error posting comment',
    'toast.commentPostedTitle': 'Comment posted!',
    'toast.commentPostedDescription': 'Your comment has been added.',
    'toast.summarizeCannotSummarizeTitle': 'Cannot Summarize',
    'toast.summarizeCannotSummarizeDescription': 'Thread content is empty.',
    'toast.summarizeFailedTitle': 'Summarization Failed',
    'toast.summarizeFailedDescription': 'Could not generate summary for this thread.',

    'userProfile.about': 'About',
    'userProfile.memberSince': 'Member since:',
    'userProfile.moreComingSoon': 'More profile information and activity will be displayed here in the future.',
    'userProfile.postsBy': "Threads by",
    'userProfile.commentsBy': "Comments by",
    'userProfile.noPosts': "This user hasn't created any threads yet.",
    'userProfile.noComments': "This user hasn't commented on anything yet.",


  },
  vi: {
    'navbar.createPost': 'Tạo Chủ đề',
    'navbar.changeLanguage': 'Thay đổi ngôn ngữ',
    'navbar.selectLanguage': 'Chọn Ngôn Ngữ',
    'navbar.logout': 'Đăng xuất',
    'navbar.login': 'Đăng nhập',
    'navbar.signup': 'Đăng ký',
    'navbar.myProfile': 'Hồ sơ của tôi',

    'home.popularThreads': 'Chủ đề Nổi bật',
    'home.createThreadButton': 'Tạo Chủ đề Mới',
    'home.loadingThreads': 'Đang tải chủ đề...',
    'home.noThreads': 'Chưa có chủ đề nào.',
    'home.beTheFirst': 'Hãy là người đầu tiên bắt đầu một cuộc thảo luận!',

    'loginPage.title': 'Chào mừng trở lại!',
    'loginPage.description': 'Đăng nhập để tiếp tục vào ForumVerse.',
    'loginPage.emailLabel': 'Email',
    'loginPage.passwordLabel': 'Mật khẩu',
    'loginPage.demoHint': 'Thử với: alice@example.com / password123',
    'loginPage.loginButton': 'Đăng Nhập',
    'loginPage.loggingInButton': 'Đang đăng nhập...',
    'loginPage.signupPrompt': 'Chưa có tài khoản?',
    'loginPage.signupLink': 'Đăng ký',

    'signupPage.title': 'Tạo Tài Khoản',
    'signupPage.description': 'Tham gia ForumVerse ngay hôm nay!',
    'signupPage.emailLabel': 'Email',
    'signupPage.usernameLabel': 'Tên người dùng',
    'signupPage.displayNameLabel': 'Tên hiển thị (Tùy chọn)',
    'signupPage.passwordLabel': 'Mật khẩu',
    'signupPage.confirmPasswordLabel': 'Xác nhận Mật khẩu',
    'signupPage.signupButton': 'Đăng Ký',
    'signupPage.signingUpButton': 'Đang đăng ký...',
    'signupPage.loginPrompt': 'Đã có tài khoản?',
    'signupPage.loginLink': 'Đăng nhập',

    'submitPage.title': 'Tạo chủ đề mới',
    'submitPage.description': 'Chia sẻ suy nghĩ của bạn với cộng đồng ForumVerse.',
    'submitPage.titleLabel': 'Tiêu đề',
    'submitPage.titlePlaceholder': 'Nhập tiêu đề mô tả',
    'submitPage.contentLabel': 'Nội dung',
    'submitPage.contentPlaceholder': 'Chia sẻ suy nghĩ của bạn (Chưa hỗ trợ Markdown)',
    'submitPage.contentPlaceholderMarkdown': 'Chia sẻ suy nghĩ của bạn (Hỗ trợ Markdown!)',
    'submitPage.createButton': 'Tạo Chủ đề',
    'submitPage.submittingButton': 'Đang gửi...',
    'submitPage.loginPrompt': 'Vui lòng đăng nhập để tạo chủ đề.',

    'notFoundPage.title': 'Không Tìm Thấy Trang',
    'notFoundPage.description': "Rất tiếc! Trang bạn đang tìm kiếm dường như không tồn tại.",
    'notFoundPage.homeButton': 'Quay Về Trang Chủ',
    'notFoundPage.userNotFoundTitle': 'Không Tìm Thấy Người Dùng',
    'notFoundPage.userNotFoundDescription': "Xin lỗi, chúng tôi không thể tìm thấy người dùng với tên đó.",


    'threadPage.commentsHeading': 'Bình luận',

    'commentSection.leaveComment': 'Để lại bình luận',
    'commentSection.noComments': 'Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!',

    'commentForm.replyPlaceholder': 'Viết một phản hồi...',
    'commentForm.commentPlaceholder': 'Bạn nghĩ gì về điều này?',
    'commentForm.loginPrompt': 'Vui lòng đăng nhập để bình luận.',
    'commentForm.replyButton': 'Phản hồi',
    'commentForm.replyingButton': 'Đang phản hồi...',
    'commentForm.commentButton': 'Bình luận',
    'commentForm.commentingButton': 'Đang bình luận...',

    'summarizeButton.buttonText': 'Tóm tắt Chủ đề',
    'summarizeButton.buttonLoadingText': 'Đang tóm tắt...',
    'summarizeButton.dialogTitlePrefix': 'Tóm tắt của:',
    'summarizeButton.dialogDescription': 'Tóm tắt các điểm chính do AI tạo:',
    'summarizeButton.dialogLoadingSummary': 'Đang tải tóm tắt...',
    'summarizeButton.dialogCloseButton': 'Đóng',

    'threadItem.commentsLink': 'Bình luận',
    'threadItem.postedBy': 'Đăng bởi',
    'threadView.postedBy': 'Đăng bởi', 

    'commentItem.replyButton': 'Phản hồi',

    'toast.loginSuccessTitle': 'Đăng nhập thành công',
    'toast.loginSuccessDescription': 'Chào mừng bạn trở lại!',
    'toast.loginFailedTitle': 'Đăng nhập thất bại',
    'toast.loginFailedDescription': "Email hoặc mật khẩu không hợp lệ. Thử 'alice@example.com' với 'password123'.",
    'toast.signupSuccessTitle': 'Đăng ký thành công',
    'toast.signupSuccessDescription': 'Chào mừng đến với ForumVerse! Bạn đã đăng nhập.',
    'toast.signupFailedTitle': 'Đăng ký thất bại',
    'toast.signupFailedDescription': 'Email hoặc tên người dùng này có thể đã được sử dụng hoặc đã xảy ra lỗi.',
    'toast.authErrorTitle': 'Lỗi xác thực',
    'toast.authErrorDescriptionCreatePost': 'Bạn phải đăng nhập để tạo chủ đề.',
    'toast.authErrorDescriptionComment': 'Bạn phải đăng nhập để bình luận.',
    'toast.errorCreatingPostTitle': 'Lỗi khi tạo chủ đề',
    'toast.postCreatedTitle': 'Đã tạo chủ đề!',
    'toast.postCreatedDescription': 'Chủ đề của bạn đã được tạo thành công.',
    'toast.errorPostingCommentTitle': 'Lỗi khi đăng bình luận',
    'toast.commentPostedTitle': 'Đã đăng bình luận!',
    'toast.commentPostedDescription': 'Bình luận của bạn đã được thêm.',
    'toast.summarizeCannotSummarizeTitle': 'Không thể tóm tắt',
    'toast.summarizeCannotSummarizeDescription': 'Nội dung chủ đề trống.',
    'toast.summarizeFailedTitle': 'Tóm tắt thất bại',
    'toast.summarizeFailedDescription': 'Không thể tạo tóm tắt cho chủ đề này.',

    'userProfile.about': 'Về',
    'userProfile.memberSince': 'Thành viên từ:',
    'userProfile.moreComingSoon': 'Thông tin hồ sơ và hoạt động khác sẽ được hiển thị ở đây trong tương lai.',
    'userProfile.postsBy': "Chủ đề của",
    'userProfile.commentsBy': "Bình luận của",
    'userProfile.noPosts': "Người dùng này chưa tạo chủ đề nào.",
    'userProfile.noComments': "Người dùng này chưa bình luận về bất cứ điều gì.",
  }
};


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [translations] = useState<AllTranslations>(PREDEFINED_TRANSLATIONS);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(CURRENT_LANGUAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === storedLanguage)) {
        setCurrentLanguageState(storedLanguage);
      } else {
        // Ensure default language is set if nothing valid is in localStorage
        localStorage.setItem(CURRENT_LANGUAGE_KEY, 'en'); 
      }
    } catch (error) {
      console.error("Failed to load language settings from localStorage", error);
      // Default to 'en' if localStorage access fails
      setCurrentLanguageState('en');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      setCurrentLanguageState(lang);
      try {
        localStorage.setItem(CURRENT_LANGUAGE_KEY, lang);
      } catch (error) {
        console.error("Failed to save current language to localStorage", error);
      }
    } else {
      console.warn(`Attempted to set unsupported language: ${lang}`);
    }
  }, []);

  const getTranslation = useCallback((key: string, defaultText: string): string => {
    if (isInitializing) return defaultText; 
    
    const langTranslations = translations[currentLanguage];
    if (langTranslations && langTranslations[key] !== undefined) {
      return langTranslations[key];
    }
    
    // Fallback to English if current language translation is missing
    if (currentLanguage !== 'en' && translations.en && translations.en[key] !== undefined) {
      // console.warn(`Translation missing for key '${key}' in language '${currentLanguage}'. Falling back to English.`);
      return translations.en[key];
    }
    
    // Fallback to default text if English is also missing (or if current lang is English and key is missing)
    // console.warn(`Translation missing for key '${key}' in English or current language '${currentLanguage}'. Using default text.`);
    return defaultText;
  }, [currentLanguage, translations, isInitializing]);


  if (isInitializing) {
    // While initializing (e.g., reading from localStorage), return null or a loading indicator
    // to prevent rendering with potentially incorrect language settings.
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getTranslation, translations, isInitializing }}>
      {children}
    </LanguageContext.Provider>
  );
};
