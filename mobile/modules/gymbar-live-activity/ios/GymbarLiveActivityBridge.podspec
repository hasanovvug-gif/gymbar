Pod::Spec.new do |s|
  s.name           = 'GymbarLiveActivityBridge'
  s.version        = '1.0.0'
  s.summary        = 'Gymbar iOS Live Activity bridge'
  s.description    = 'Starts, updates, and reconciles the Gymbar workout Live Activity.'
  s.author         = 'Gymbar'
  s.homepage       = 'https://expo.dev'
  s.platforms      = { :ios => '16.2' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
