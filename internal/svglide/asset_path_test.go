package svglide

import "testing"

func TestValidatePreparedImageAssetPath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		want    string
		wantErr bool
	}{
		{name: "valid", path: "assets/images/hero.png", want: "assets/images/hero.png"},
		{name: "trim", path: " assets/images/hero.png ", want: "assets/images/hero.png"},
		{name: "empty", path: "", wantErr: true},
		{name: "remote", path: "https://example.com/hero.png", wantErr: true},
		{name: "parent directory", path: "../hero.png", wantErr: true},
		{name: "absolute", path: "/Users/example/hero.png", wantErr: true},
		{name: "file url", path: "file:///tmp/hero.png", wantErr: true},
		{name: "protocol relative", path: "//example.com/hero.png", wantErr: true},
		{name: "data url", path: "data:image/png;base64,AAAA", wantErr: true},
		{name: "percent", path: "assets/images/hero%2epng", wantErr: true},
		{name: "nested", path: "assets/images/nested/hero.png", wantErr: true},
		{name: "wrong directory", path: "assets/other/hero.png", wantErr: true},
		{name: "leading dot", path: "assets/images/.hero.png", wantErr: true},
		{name: "dot dot filename", path: "assets/images/hero..png", wantErr: true},
		{name: "backslash", path: `assets\images\hero.png`, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := validatePreparedImageAssetPath(tt.path)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got path %q", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("path = %q, want %q", got, tt.want)
			}
		})
	}
}
